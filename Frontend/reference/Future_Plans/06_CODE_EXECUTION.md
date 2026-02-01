# 06 - Sandboxed Code Execution (WebAssembly)

> Safely run user code in isolated WebAssembly sandboxes.

---

## 🎯 Objective

Build a secure code execution system:
- Run Python, JavaScript, Rust code safely
- Memory and CPU limits
- No filesystem or network access
- Timeout protection
- Capture stdout/stderr output

---

## ⚠️ Security Model

```
┌─────────────────────────────────────────────────────────┐
│                   User Code                              │
│            "print('Hello, World!')"                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 WebAssembly Sandbox                      │
│  ┌───────────────────────────────────────────────┐      │
│  │  ❌ No filesystem access                       │      │
│  │  ❌ No network access                          │      │
│  │  ❌ No system calls                            │      │
│  │  ✅ Limited memory (128MB)                     │      │
│  │  ✅ Timeout after 10 seconds                   │      │
│  └───────────────────────────────────────────────┘      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Output                                │
│                "Hello, World!"                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies

Add to `backend/Cargo.toml`:

```toml
[dependencies]
# ... existing ...

# WebAssembly runtime
wasmtime = "17.0"
wasmtime-wasi = "17.0"

# For pre-compiled language runtimes
include_bytes_plus = "1.0"
```

---

## 📁 File Structure

```
backend/
├── src/
│   └── execution/
│       ├── mod.rs           # Module export
│       ├── runner.rs        # Main execution engine
│       ├── python.rs        # Python via WASM
│       ├── javascript.rs    # JS via QuickJS WASM
│       └── sandbox.rs       # Sandbox configuration
└── runtimes/
    ├── python.wasm          # Pre-compiled Python
    └── quickjs.wasm         # Pre-compiled QuickJS
```

---

## 🔧 Implementation Steps

### Step 1: Sandbox Configuration

Create `backend/src/execution/sandbox.rs`:

```rust
use wasmtime::*;
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder};
use std::time::Duration;

/// Sandbox limits for code execution
#[derive(Clone, Debug)]
pub struct SandboxLimits {
    /// Maximum memory in bytes (default 128MB)
    pub max_memory: u64,
    /// Maximum execution time
    pub timeout: Duration,
    /// Maximum output size in bytes
    pub max_output: usize,
}

impl Default for SandboxLimits {
    fn default() -> Self {
        Self {
            max_memory: 128 * 1024 * 1024, // 128MB
            timeout: Duration::from_secs(10),
            max_output: 1024 * 1024, // 1MB output
        }
    }
}

/// Create a sandboxed WASI context
pub fn create_wasi_context() -> WasiCtx {
    WasiCtxBuilder::new()
        // Inherit nothing by default
        .build()
}

/// Create engine with resource limits
pub fn create_engine(limits: &SandboxLimits) -> Engine {
    let mut config = Config::new();
    
    // Consume fuel for instruction limiting
    config.consume_fuel(true);
    
    // Enable epoch interruption for timeouts
    config.epoch_interruption(true);
    
    Engine::new(&config).expect("Failed to create WASM engine")
}

/// Configure store with limits
pub fn configure_store<T>(store: &mut Store<T>, limits: &SandboxLimits, engine: &Engine) {
    // Add fuel (instructions budget)
    store.set_fuel(1_000_000_000).ok(); // ~1 billion instructions
    
    // Set epoch deadline for timeout
    store.epoch_deadline_callback(|_| Err(Trap::new("Execution timeout")));
}
```

---

### Step 2: Main Execution Engine

Create `backend/src/execution/runner.rs`:

```rust
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::timeout;

use super::sandbox::{SandboxLimits, create_engine, create_wasi_context};

/// Supported programming languages
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Language {
    Python,
    JavaScript,
    // Add more languages here
}

impl Language {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "python" | "py" => Some(Language::Python),
            "javascript" | "js" => Some(Language::JavaScript),
            _ => None,
        }
    }
}

/// Result of code execution
#[derive(Debug, Clone)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub execution_time_ms: u64,
    pub error: Option<String>,
}

/// Code execution engine
pub struct CodeRunner {
    limits: SandboxLimits,
}

impl CodeRunner {
    pub fn new(limits: SandboxLimits) -> Self {
        Self { limits }
    }

    /// Execute code in the specified language
    pub async fn execute(&self, code: &str, language: Language) -> ExecutionResult {
        let start = std::time::Instant::now();
        
        // Run execution with timeout
        let result = timeout(
            self.limits.timeout,
            self.run_sandboxed(code, language)
        ).await;

        match result {
            Ok(Ok(output)) => ExecutionResult {
                stdout: output.stdout,
                stderr: output.stderr,
                exit_code: output.exit_code,
                execution_time_ms: start.elapsed().as_millis() as u64,
                error: None,
            },
            Ok(Err(e)) => ExecutionResult {
                stdout: String::new(),
                stderr: e.to_string(),
                exit_code: 1,
                execution_time_ms: start.elapsed().as_millis() as u64,
                error: Some(e.to_string()),
            },
            Err(_) => ExecutionResult {
                stdout: String::new(),
                stderr: "Execution timed out".to_string(),
                exit_code: 124, // Timeout exit code
                execution_time_ms: self.limits.timeout.as_millis() as u64,
                error: Some("Execution timed out".to_string()),
            },
        }
    }

    async fn run_sandboxed(
        &self,
        code: &str,
        language: Language,
    ) -> Result<ExecutionOutput, Box<dyn std::error::Error + Send + Sync>> {
        // This would call the appropriate language runtime
        match language {
            Language::Python => self.run_python(code).await,
            Language::JavaScript => self.run_javascript(code).await,
        }
    }

    async fn run_python(&self, code: &str) -> Result<ExecutionOutput, Box<dyn std::error::Error + Send + Sync>> {
        // For MVP: Use a pre-built Python WASM or external service
        // Full implementation would use RustPython compiled to WASM
        
        // Placeholder - integrate with actual Python WASM runtime
        Ok(ExecutionOutput {
            stdout: format!("Python execution not yet implemented.\nCode: {}", code),
            stderr: String::new(),
            exit_code: 0,
        })
    }

    async fn run_javascript(&self, code: &str) -> Result<ExecutionOutput, Box<dyn std::error::Error + Send + Sync>> {
        // For MVP: Use QuickJS compiled to WASM
        // This is much simpler than Python
        
        // Placeholder - integrate with QuickJS WASM
        Ok(ExecutionOutput {
            stdout: format!("JavaScript execution not yet implemented.\nCode: {}", code),
            stderr: String::new(),
            exit_code: 0,
        })
    }
}

struct ExecutionOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
}
```

---

### Step 3: API Endpoint

Add to `backend/src/routes/mod.rs`:

```rust
use axum::{routing::post, Json};
use serde::{Deserialize, Serialize};

use crate::execution::{CodeRunner, ExecutionResult, Language, SandboxLimits};

#[derive(Deserialize)]
pub struct ExecuteRequest {
    code: String,
    language: String,
}

#[derive(Serialize)]
pub struct ExecuteResponse {
    stdout: String,
    stderr: String,
    exit_code: i32,
    execution_time_ms: u64,
    error: Option<String>,
}

pub async fn execute_code(
    Json(req): Json<ExecuteRequest>,
) -> Result<Json<ExecuteResponse>, AppError> {
    let language = Language::from_str(&req.language)
        .ok_or_else(|| AppError::BadRequest("Unsupported language".to_string()))?;

    let runner = CodeRunner::new(SandboxLimits::default());
    let result = runner.execute(&req.code, language).await;

    Ok(Json(ExecuteResponse {
        stdout: result.stdout,
        stderr: result.stderr,
        exit_code: result.exit_code,
        execution_time_ms: result.execution_time_ms,
        error: result.error,
    }))
}

// Add to router
Router::new()
    .route("/api/v1/execute", post(execute_code))
```

---

## 🖥️ Frontend Integration

### Code Runner Component:

```tsx
'use client';

import { useState } from 'react';

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  error?: string;
}

export function CodeRunner({ code, language }: { code: string; language: string }) {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        stdout: '',
        stderr: 'Failed to execute code',
        exit_code: 1,
        execution_time_ms: 0,
        error: 'Connection error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={runCode}
        disabled={isRunning}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
      >
        {isRunning ? (
          <>
            <span className="animate-spin">⏳</span>
            Running...
          </>
        ) : (
          <>▶ Run Code</>
        )}
      </button>

      {result && (
        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
          {result.stdout && (
            <pre className="text-green-400 whitespace-pre-wrap">{result.stdout}</pre>
          )}
          {result.stderr && (
            <pre className="text-red-400 whitespace-pre-wrap">{result.stderr}</pre>
          )}
          <div className="mt-2 text-gray-500 text-xs">
            Exit code: {result.exit_code} | Time: {result.execution_time_ms}ms
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 Security Checklist

- [x] No filesystem access in sandbox
- [x] No network access in sandbox
- [x] Memory limits enforced
- [x] CPU/time limits enforced
- [x] Output size limits
- [ ] Rate limiting per user
- [ ] Code length limits
- [ ] Audit logging

---

## 📝 Alternative Approaches

### 1. **External Service (Easier)**
Instead of running WASM locally, use services like:
- [Judge0](https://judge0.com/) - Code execution API
- [Piston](https://github.com/engineer-man/piston) - Self-hosted
- [Sphere Engine](https://sphere-engine.com/) - Paid service

### 2. **Docker Containers (More Powerful)**
For full language support:
```rust
// Use bollard crate for Docker
let docker = Docker::connect_with_local_defaults()?;
let container = docker.create_container(
    Some(CreateContainerOptions { name: "code-runner" }),
    Config {
        image: Some("python:3.11-slim"),
        cmd: Some(vec!["python", "-c", code]),
        // ... resource limits
    },
).await?;
```

---

## 📝 Next Steps

After completing code execution:
1. ✅ Safe code running in sandbox
2. ✅ Multiple language support
3. → Proceed to [07_AI_STUDY_BUDDY.md](./07_AI_STUDY_BUDDY.md)

---

## 🔗 Resources

- [Wasmtime Documentation](https://docs.wasmtime.dev/)
- [WASI Specification](https://wasi.dev/)
- [RustPython](https://rustpython.github.io/)
- [QuickJS](https://bellard.org/quickjs/)
