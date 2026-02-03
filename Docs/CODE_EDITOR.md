# Code Playground Architecture

> How the Code Playground feature works in Chill Space

---

## Overview

The Code Playground allows users to write, compile, and run code in Python, Java, and JavaScript directly from their browser. The architecture consists of:

1. **Frontend** (Next.js) - Monaco Editor + UI
2. **Backend** (Rust Actix-Web) - Code execution service

---

## Flow Diagram

```
┌─────────────────────┐         HTTP POST         ┌─────────────────────┐
│    Next.js App      │  ────────────────────▶    │   Rust Backend      │
│  (Monaco Editor)    │                           │   (Actix-Web)       │
│                     │  ◀────────────────────    │                     │
│  /code page         │     JSON Response         │  /api/v1/code/run   │
└─────────────────────┘                           └─────────────────────┘
         │                                                  │
         ▼                                                  ▼
   User writes code                               Executes in sandbox
   in browser                                     Python/Java/Node
```

---

## Frontend (page.tsx)

### Key Components

| Component | Purpose |
|-----------|---------|
| **Monaco Editor** | VS Code-quality code editing |
| **Language Switcher** | Dropdown with real SVG logos |
| **Run Button** | Triggers code execution |
| **Output Panel** | Displays stdout/stderr with error parsing |

### Code Execution Flow

```typescript
const handleRun = async () => {
    // 1. Send code to backend
    const res = await fetch(`${API_BASE_URL}/code/run`, {
        method: 'POST',
        body: JSON.stringify({ language: 'python', code: userCode }),
    });

    // 2. Parse response
    const data = await res.json();
    // data = { stdout, stderr, exit_code, duration_ms, error }

    // 3. Display output with error parsing
    if (data.stderr) {
        const errors = parseErrorOutput(data.stderr, language);
        // Display formatted errors
    }
};
```

### Error Parsing

The frontend parses stack traces for better readability:

- **Python**: Extracts error type, message, file, and line number from traceback
- **Java**: Parses compilation errors and runtime exceptions
- **JavaScript**: Identifies TypeError, ReferenceError, SyntaxError

---

## Backend (Rust)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check with supported languages |
| `/api/v1/code/run` | POST | Execute code and return output |

### Request/Response

**Request:**
```json
{
    "language": "python",
    "code": "print('Hello, Chill Space!')"
}
```

**Response:**
```json
{
    "stdout": "Hello, Chill Space!\n",
    "stderr": "",
    "exit_code": 0,
    "duration_ms": 45,
    "error": null
}
```

### Security Measures

| Security | Implementation |
|----------|----------------|
| **Timeout** | 10 second max execution |
| **Code Size** | 50KB max input |
| **Output Size** | 100KB max output |
| **Sandboxing** | Runs via subprocess with limited permissions |

---

## Supported Languages

| Language | Status | Runtime |
|----------|--------|---------|
| Python | ✅ Available | `python3` |
| Java | ✅ Available | `javac` + `java` |
| JavaScript | ✅ Available | `node` |
| TypeScript | 🔜 Coming Soon | - |
| Rust | 🔜 Coming Soon | - |
| Go | 🔜 Coming Soon | - |
| C++ | 🔜 Coming Soon | - |

---

## Demo Mode

When the backend is offline, the frontend automatically switches to **Demo Mode**:

- Shows a mock output
- Displays connection status as "Demo"
- Gracefully handles errors

---

## File Structure

```
Frontend/src/app/(dashboard)/code/
└── page.tsx          # Complete Code Playground component

backend/src/
├── main.rs           # Actix-Web server + routes
└── code_runner.rs    # Sandbox execution logic
```
