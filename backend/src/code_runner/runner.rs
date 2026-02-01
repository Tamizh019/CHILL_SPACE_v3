use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Instant;
use tokio::time::{timeout, Duration};
use uuid::Uuid;

// ============================================================================
// ENUMS & STRUCTS
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    Python,
    JavaScript,
    Rust,
    Go,
    Java,
    Cpp,
}

impl Language {
    pub fn extension(&self) -> &str {
        match self {
            Language::Python => "py",
            Language::JavaScript => "js",
            Language::Rust => "rs",
            Language::Go => "go",
            Language::Java => "java",
            Language::Cpp => "cpp",
        }
    }

    pub fn docker_image(&self) -> &str {
        match self {
            Language::Python => "python:3.11-slim",
            Language::JavaScript => "node:20-alpine",
            Language::Rust => "rust:1.75-slim",
            Language::Go => "golang:1.21-alpine",
            Language::Java => "openjdk:17-slim",
            Language::Cpp => "gcc:13-bookworm",
        }
    }

    pub fn compile_command(&self, file_path: &str) -> Option<Vec<String>> {
        match self {
            Language::Rust => Some(vec![
                "rustc".to_string(),
                file_path.to_string(),
                "-o".to_string(),
                "/tmp/output".to_string(),
            ]),
            Language::Cpp => Some(vec![
                "g++".to_string(),
                file_path.to_string(),
                "-o".to_string(),
                "/tmp/output".to_string(),
            ]),
            Language::Java => Some(vec!["javac".to_string(), file_path.to_string()]),
            _ => None,
        }
    }

    pub fn run_command(&self, file_path: &str) -> Vec<String> {
        match self {
            Language::Python => vec!["python3".to_string(), file_path.to_string()],
            Language::JavaScript => vec!["node".to_string(), file_path.to_string()],
            Language::Rust | Language::Cpp => vec!["/tmp/output".to_string()],
            Language::Go => vec!["go".to_string(), "run".to_string(), file_path.to_string()],
            Language::Java => {
                let class_name = file_path.replace(".java", "").replace("/tmp/", "");
                vec!["java".to_string(), class_name]
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionRequest {
    pub language: Language,
    pub code: String,
    pub input: Option<String>,
    pub timeout_seconds: Option<u64>,
    pub memory_limit_mb: Option<u64>,
    pub use_docker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u128,
    pub exit_code: i32,
    pub error: Option<String>,
    pub execution_id: String,
    pub memory_used_kb: Option<u64>,
    pub compilation_output: Option<String>,
}

#[derive(Debug, Clone)]
pub struct SecurityConfig {
    pub max_execution_time_secs: u64,
    pub max_memory_mb: u64,
    pub max_output_size_kb: u64,
    pub enable_network: bool,
    pub blacklisted_patterns: Vec<String>,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            max_execution_time_secs: 10,
            max_memory_mb: 256,
            max_output_size_kb: 1024,
            enable_network: false,
            blacklisted_patterns: vec![
                "rm -rf".to_string(),
                ":(){ :|:& };:".to_string(), // fork bomb
                "eval(".to_string(),
                "__import__('os')".to_string(),
                "execve".to_string(),
                "system(".to_string(),
                "/etc/passwd".to_string(),
                "subprocess.".to_string(),
            ],
        }
    }
}

// ============================================================================
// CODE RUNNER
// ============================================================================

pub struct CodeRunner {
    security_config: SecurityConfig,
    container_manager: ContainerManager,
    temp_dir: PathBuf,
}

impl CodeRunner {
    pub fn new(security_config: Option<SecurityConfig>) -> Self {
        Self {
            security_config: security_config.unwrap_or_default(),
            container_manager: ContainerManager::new(),
            temp_dir: PathBuf::from("/tmp/code-runner"),
        }
    }

    pub async fn execute(&mut self, request: ExecutionRequest) -> ExecutionResult {
        let execution_id = Uuid::new_v4().to_string();
        let start = Instant::now();

        // Security validation
        if let Err(error_msg) = self.validate_code(&request.code) {
            return ExecutionResult {
                stdout: String::new(),
                stderr: error_msg.clone(),
                duration_ms: 0,
                exit_code: -1,
                error: Some(error_msg),
                execution_id,
                memory_used_kb: None,
                compilation_output: None,
            };
        }

        // Create temp directory
        fs::create_dir_all(&self.temp_dir).ok();

        // Determine execution method
        let use_docker = request.use_docker.unwrap_or(true);
        
        let result = if use_docker {
            self.execute_in_docker(&request, &execution_id).await
        } else {
            self.execute_local(&request, &execution_id).await
        };

        let duration = start.elapsed().as_millis();

        ExecutionResult {
            duration_ms: duration,
            execution_id,
            ..result
        }
    }

    fn validate_code(&self, code: &str) -> Result<(), String> {
        // Check for blacklisted patterns
        for pattern in &self.security_config.blacklisted_patterns {
            if code.contains(pattern) {
                return Err(format!("Security violation: Code contains forbidden pattern '{}'", pattern));
            }
        }

        // Check code size (max 100KB)
        if code.len() > 100_000 {
            return Err("Code size exceeds 100KB limit".to_string());
        }

        Ok(())
    }

    async fn execute_in_docker(
        &mut self,
        request: &ExecutionRequest,
        execution_id: &str,
    ) -> ExecutionResult {
        let file_name = format!("code_{}.{}", execution_id, request.language.extension());
        let file_path = self.temp_dir.join(&file_name);

        // Write code to file
        if let Err(e) = fs::write(&file_path, &request.code) {
            return self.error_result(&format!("Failed to write code file: {}", e));
        }

        let timeout_secs = request
            .timeout_seconds
            .unwrap_or(self.security_config.max_execution_time_secs);

        let container_result = self
            .container_manager
            .run_code_in_container(
                &request.language,
                &file_path,
                request.input.as_deref(),
                timeout_secs,
                request.memory_limit_mb.unwrap_or(self.security_config.max_memory_mb),
            )
            .await;

        // Cleanup
        fs::remove_file(&file_path).ok();

        container_result
    }

    async fn execute_local(
        &mut self,
        request: &ExecutionRequest,
        execution_id: &str,
    ) -> ExecutionResult {
        match request.language {
            Language::Python => self.run_python(&request.code, request.input.as_deref()).await,
            Language::JavaScript => self.run_javascript(&request.code, request.input.as_deref()).await,
            _ => self.error_result("Language not supported for local execution"),
        }
    }

    async fn run_python(&self, code: &str, _input: Option<&str>) -> ExecutionResult {
        // Simple mock for demo - replace with actual subprocess execution
        let stdout = if code.contains("print") {
            code.lines()
                .filter(|line| line.contains("print"))
                .map(|line| {
                    line.replace("print(\"", "")
                        .replace("\")", "")
                        .replace("print('", "")
                        .replace("')", "")
                })
                .collect::<Vec<_>>()
                .join("\n")
        } else {
            String::new()
        };

        ExecutionResult {
            stdout,
            stderr: String::new(),
            duration_ms: 0,
            exit_code: 0,
            error: None,
            execution_id: Uuid::new_v4().to_string(),
            memory_used_kb: Some(1024),
            compilation_output: None,
        }
    }

    async fn run_javascript(&self, _code: &str, _input: Option<&str>) -> ExecutionResult {
        self.error_result("JavaScript local execution not yet implemented")
    }

    fn error_result(&self, message: &str) -> ExecutionResult {
        ExecutionResult {
            stdout: String::new(),
            stderr: message.to_string(),
            duration_ms: 0,
            exit_code: 1,
            error: Some(message.to_string()),
            execution_id: Uuid::new_v4().to_string(),
            memory_used_kb: None,
            compilation_output: None,
        }
    }
}

// ============================================================================
// CONTAINER MANAGER
// ============================================================================

pub struct ContainerManager {
    active_containers: HashMap<String, ContainerInfo>,
}

#[derive(Debug, Clone)]
struct ContainerInfo {
    container_id: String,
    language: Language,
    created_at: Instant,
}

impl ContainerManager {
    pub fn new() -> Self {
        Self {
            active_containers: HashMap::new(),
        }
    }

    pub async fn run_code_in_container(
        &mut self,
        language: &Language,
        file_path: &PathBuf,
        input: Option<&str>,
        timeout_secs: u64,
        memory_limit_mb: u64,
    ) -> ExecutionResult {
        let container_id = Uuid::new_v4().to_string();
        let image = language.docker_image();

        // Build docker run command
        let mut docker_args = vec![
            "run".to_string(),
            "--rm".to_string(),
            "--name".to_string(),
            container_id.clone(),
            "--network".to_string(),
            "none".to_string(), // Disable network
            "--memory".to_string(),
            format!("{}m", memory_limit_mb),
            "--cpus".to_string(),
            "1.0".to_string(),
            "-v".to_string(),
            format!("{}:/code:ro", file_path.to_string_lossy()),
            image.to_string(),
        ];

        // Add run command
        let run_cmd = language.run_command("/code");
        docker_args.extend(run_cmd);

        // Execute with timeout
        let execution = async {
            Command::new("docker")
                .args(&docker_args)
                .stdin(if input.is_some() { Stdio::piped() } else { Stdio::null() })
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .and_then(|mut child| {
                    // Write input if provided
                    if let Some(input_data) = input {
                        if let Some(mut stdin) = child.stdin.take() {
                            stdin.write_all(input_data.as_bytes()).ok();
                        }
                    }
                    child.wait_with_output()
                })
        };

        match timeout(Duration::from_secs(timeout_secs), execution).await {
            Ok(Ok(output)) => ExecutionResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                duration_ms: 0,
                exit_code: output.status.code().unwrap_or(-1),
                error: None,
                execution_id: container_id.clone(),
                memory_used_kb: None,
                compilation_output: None,
            },
            Ok(Err(e)) => ExecutionResult {
                stdout: String::new(),
                stderr: format!("Docker execution failed: {}", e),
                duration_ms: 0,
                exit_code: -1,
                error: Some(e.to_string()),
                execution_id: container_id,
                memory_used_kb: None,
                compilation_output: None,
            },
            Err(_) => {
                // Timeout occurred - force kill container
                Command::new("docker")
                    .args(&["kill", &container_id])
                    .output()
                    .ok();

                ExecutionResult {
                    stdout: String::new(),
                    stderr: format!("Execution timed out after {} seconds", timeout_secs),
                    duration_ms: (timeout_secs * 1000) as u128,
                    exit_code: -1,
                    error: Some("Timeout".to_string()),
                    execution_id: container_id,
                    memory_used_kb: None,
                    compilation_output: None,
                }
            }
        }
    }

    pub fn cleanup_all(&mut self) {
        for (_, info) in self.active_containers.iter() {
            Command::new("docker")
                .args(&["kill", &info.container_id])
                .output()
                .ok();
        }
        self.active_containers.clear();
    }

    pub fn get_active_count(&self) -> usize {
        self.active_containers.len()
    }
}

impl Drop for ContainerManager {
    fn drop(&mut self) {
        self.cleanup_all();
    }
}
