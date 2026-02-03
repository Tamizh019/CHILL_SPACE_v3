---
title: Chill Space Code Runner
emoji: 🚀
colorFrom: purple
colorTo: blue
sdk: docker
pinned: false
license: mit
---

# Chill Space Code Runner

A secure code execution API for the Chill Space learning platform.

## Features

- **Languages**: Python, JavaScript, Java
- **Security**: 10-second timeout, code length limits, dangerous pattern blocking
- **Performance**: Rust-powered with async execution

## API Endpoints

### Health Check
```
GET /api/v1/health
```

### Run Code
```
POST /api/v1/code/run
Content-Type: application/json

{
  "language": "python",
  "code": "print('Hello, World!')"
}
```

**Response:**
```json
{
  "stdout": "Hello, World!\n",
  "stderr": "",
  "exit_code": 0,
  "duration_ms": 45,
  "error": null
}
```

## Security Measures

- ⏱️ 10-second execution timeout
- 📏 50KB max code length
- 📤 100KB max output length
- 🔒 Blocked: file system, network, system commands

## Local Development

```bash
cargo run
```

Server runs on `http://localhost:7860`
