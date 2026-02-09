use std::process::{Command, Stdio};
use std::time::Duration;
use std::fs;
use tokio::time::timeout;

/// Security limits
const MAX_EXECUTION_TIME_SECS: u64 = 10;
const MAX_CODE_LENGTH: usize = 50_000;
const MAX_OUTPUT_LENGTH: usize = 100_000; // 100KB

/// Dangerous patterns to block (case-insensitive check)
const PYTHON_BLOCKED: &[&str] = &[
    "import os", "from os", "import subprocess", "from subprocess",
    "import shutil", "from shutil", "import sys", "from sys import",
    "__import__", "eval(", "exec(", "compile(",
    "open(", "os.system", "os.popen", "os.exec",
    "subprocess.run", "subprocess.call", "subprocess.Popen",
    "socket", "requests.", "urllib", "http.client",
    "import pickle", "import marshal",
];

const JS_BLOCKED: &[&str] = &[
    "require('fs')", "require(\"fs\")", "require('child_process')", "require(\"child_process\")",
    "require('os')", "require(\"os\")", "require('net')", "require(\"net\")",
    "require('http')", "require(\"http\")", "require('https')", "require(\"https\")",
    "import fs", "import { ", "from 'fs'", "from \"fs\"",
    "process.env", "process.exit", "process.kill",
    "eval(", "Function(", "child_process",
];

const JAVA_BLOCKED: &[&str] = &[
    "Runtime.getRuntime", "ProcessBuilder", "Process ",
    "java.io.File", "java.nio.file", "FileInputStream", "FileOutputStream",
    "java.net.", "Socket", "ServerSocket", "URL(", "HttpURLConnection",
    "System.exit", "System.getenv", "System.getProperty",
    "ClassLoader", "Reflection", "setAccessible",
];

/// Check if code contains dangerous patterns
fn check_security(language: &str, code: &str) -> Result<(), String> {
    // Check code length
    if code.len() > MAX_CODE_LENGTH {
        return Err(format!(
            "Code too long: {} chars (max: {} chars)",
            code.len(),
            MAX_CODE_LENGTH
        ));
    }

    let code_lower = code.to_lowercase();
    
    let blocked_patterns = match language {
        "python" => PYTHON_BLOCKED,
        "javascript" => JS_BLOCKED,
        "java" => JAVA_BLOCKED,
        _ => return Ok(()),
    };

    for pattern in blocked_patterns {
        if code_lower.contains(&pattern.to_lowercase()) {
            return Err(format!(
                "🔒 Security: '{}' is not allowed for safety reasons.\n\
                This code execution environment is sandboxed and doesn't support:\n\
                • File system operations\n\
                • Network requests\n\
                • System commands\n\
                • Process spawning",
                pattern
            ));
        }
    }

    Ok(())
}

/// Truncate output if too long
fn truncate_output(output: String) -> String {
    if output.len() > MAX_OUTPUT_LENGTH {
        let truncated = &output[..MAX_OUTPUT_LENGTH];
        format!("{}\n\n[... Output truncated at 100KB ...]", truncated)
    } else {
        output
    }
}

/// Returns (stdout, stderr, exit_code) or an error message
pub async fn execute(language: &str, code: &str) -> Result<(String, String, i32), String> {
    // Security check first
    check_security(language, code)?;

    // Run with timeout
    let result = timeout(
        Duration::from_secs(MAX_EXECUTION_TIME_SECS),
        tokio::task::spawn_blocking({
            let language = language.to_string();
            let code = code.to_string();
            move || execute_sync(&language, &code)
        })
    ).await;

    match result {
        Ok(Ok(Ok((stdout, stderr, exit_code)))) => {
            Ok((truncate_output(stdout), truncate_output(stderr), exit_code))
        }
        Ok(Ok(Err(e))) => Err(e),
        Ok(Err(e)) => Err(format!("Execution error: {}", e)),
        Err(_) => Err(format!(
            "⏱️ Timeout: Code execution exceeded {} seconds.\n\
            Your code may contain an infinite loop or is taking too long.\n\
            Please optimize your code and try again.",
            MAX_EXECUTION_TIME_SECS
        )),
    }
}

/// Synchronous execution (called from blocking task)
fn execute_sync(language: &str, code: &str) -> Result<(String, String, i32), String> {
    match language {
        "python" => run_python(code),
        "javascript" => run_javascript(code),
        "java" => run_java(code),
        _ => Err(format!("Language '{}' is not supported yet", language)),
    }
}

fn run_python(code: &str) -> Result<(String, String, i32), String> {
    // Try python3 first, then python
    let python_cmd = if cfg!(unix) { "python3" } else { "python" };
    
    let output = Command::new(python_cmd)
        .arg("-c")
        .arg(code)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to run Python: {}. Make sure Python is installed.", e))?;
    
    Ok((
        String::from_utf8_lossy(&output.stdout).to_string(),
        String::from_utf8_lossy(&output.stderr).to_string(),
        output.status.code().unwrap_or(-1),
    ))
}

fn run_javascript(code: &str) -> Result<(String, String, i32), String> {
    let output = Command::new("node")
        .arg("-e")
        .arg(code)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to run Node.js: {}. Make sure Node.js is installed.", e))?;
    
    Ok((
        String::from_utf8_lossy(&output.stdout).to_string(),
        String::from_utf8_lossy(&output.stderr).to_string(),
        output.status.code().unwrap_or(-1),
    ))
}

fn run_java(code: &str) -> Result<(String, String, i32), String> {
    // Create temp directory for Java files
    let temp_dir = std::env::temp_dir().join("chill_space_java");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp dir: {}", e))?;
    
    // Extract class name from code
    let class_name = extract_java_class_name(code).unwrap_or_else(|| "Main".to_string());
    let file_path = temp_dir.join(format!("{}.java", class_name));
    
    // Write code to file
    fs::write(&file_path, code).map_err(|e| format!("Failed to write Java file: {}", e))?;
    
    // Compile
    let compile = Command::new("javac")
        .arg(&file_path)
        .current_dir(&temp_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to compile Java: {}. Make sure JDK is installed.", e))?;
    
    if !compile.status.success() {
        // Cleanup on error
        let _ = fs::remove_file(&file_path);
        return Ok((
            String::new(),
            String::from_utf8_lossy(&compile.stderr).to_string(),
            compile.status.code().unwrap_or(-1),
        ));
    }
    
    // Run
    let output = Command::new("java")
        .arg(&class_name)
        .current_dir(&temp_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to run Java: {}", e))?;
    
    // Cleanup
    let _ = fs::remove_file(&file_path);
    let _ = fs::remove_file(temp_dir.join(format!("{}.class", class_name)));
    
    Ok((
        String::from_utf8_lossy(&output.stdout).to_string(),
        String::from_utf8_lossy(&output.stderr).to_string(),
        output.status.code().unwrap_or(-1),
    ))
}

fn extract_java_class_name(code: &str) -> Option<String> {
    for line in code.lines() {
        let trimmed = line.trim();
        if trimmed.contains("public class") || trimmed.starts_with("class ") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            for (i, part) in parts.iter().enumerate() {
                if *part == "class" && i + 1 < parts.len() {
                    let name = parts[i + 1].trim_end_matches('{').trim();
                    return Some(name.to_string());
                }
            }
        }
    }
    None
}
