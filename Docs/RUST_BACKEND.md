# Rust Backend Integration

> How the Rust Actix-Web backend connects to the Next.js frontend

---

## Overview

Chill Space uses a **Rust microservice** built with Actix-Web to handle CPU-intensive tasks like code execution. This architecture provides:

- **High Performance** - Rust's zero-cost abstractions
- **Memory Safety** - No buffer overflows or memory leaks
- **Concurrency** - Async/await with Tokio runtime
- **Security** - Sandbox code execution

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                        │
│                     (Vercel / Netlify)                          │
├────────────────────────────────────────────────────────────────┤
│  fetch('/api/v1/code/run')  ──────▶  CORS  ──────▶  /code/run  │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                     Rust Actix-Web Backend                      │
│                    (Hugging Face Spaces)                        │
├────────────────────────────────────────────────────────────────┤
│  main.rs                                                        │
│  ├── Health endpoint: GET /api/v1/health                       │
│  └── Code runner: POST /api/v1/code/run                        │
│                                                                 │
│  code_runner.rs                                                 │
│  ├── Python execution (python3)                                │
│  ├── Java execution (javac + java)                             │
│  └── JavaScript execution (node)                               │
└────────────────────────────────────────────────────────────────┘
```

---

## CORS Configuration

The Rust backend allows requests from the frontend:

```rust
let frontend_url = std::env::var("FRONTEND_URL")
    .unwrap_or_else(|_| "http://localhost:3000".to_string());

let cors = Cors::default()
    .allowed_origin(&frontend_url)
    .allowed_origin("http://localhost:3000")
    .allowed_methods(vec!["GET", "POST", "OPTIONS"])
    .allowed_headers(vec![CONTENT_TYPE, ACCEPT])
    .max_age(3600);
```

---

## Frontend Integration

### Environment Variable

Set the backend URL in `.env.local`:

```env
NEXT_PUBLIC_CODE_API_URL=https://your-space.hf.space/api/v1
```

### API Client

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_CODE_API_URL 
    || 'http://localhost:8080/api/v1';

// Health check
const checkBackend = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/health`, {
            signal: AbortSignal.timeout(3000)
        });
        return res.ok ? 'online' : 'offline';
    } catch {
        return 'offline';
    }
};

// Execute code
const runCode = async (language: string, code: string) => {
    const res = await fetch(`${API_BASE_URL}/code/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code }),
        signal: AbortSignal.timeout(15000)
    });
    return await res.json();
};
```

---

## Deployment

### Hugging Face Spaces

The backend is deployed to Hugging Face Spaces as a Docker container:

```dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    python3 default-jdk nodejs npm
COPY --from=builder /app/target/release/backend /app/backend
CMD ["/app/backend"]
```

### Deployment Commands

```bash
# Push to Hugging Face
git subtree push --prefix backend hf main
```

---

## Running Locally

### Prerequisites

- Rust 1.70+
- Python 3
- Node.js 18+
- Java JDK 17+

### Start Backend

```bash
cd backend
cargo run
```

The server starts on `http://localhost:7860` (or port 8080 depending on config).

### Start Frontend

```bash
cd Frontend
npm run dev
```

Frontend runs on `http://localhost:3000` and connects to the backend.

---

## API Reference

### Health Check

```http
GET /api/v1/health
```

**Response:**
```json
{
    "status": "ok",
    "service": "chill-space-code-runner",
    "version": "0.1.0",
    "languages": ["python", "javascript", "java"]
}
```

### Run Code

```http
POST /api/v1/code/run
Content-Type: application/json

{
    "language": "python",
    "code": "print('Hello!')"
}
```

**Response:**
```json
{
    "stdout": "Hello!\n",
    "stderr": "",
    "exit_code": 0,
    "duration_ms": 42,
    "error": null
}
```

---

## Security

| Feature | Implementation |
|---------|----------------|
| **Execution Timeout** | 10 seconds max |
| **Code Size Limit** | 50KB |
| **Output Size Limit** | 100KB |
| **CORS** | Only allowed origins |
| **Sandbox** | Subprocess execution |

---

## Troubleshooting

### Backend Offline

If the backend is unreachable, the frontend shows "Demo Mode" and provides a mock response. Check:

1. Is the backend running? (`cargo run`)
2. Correct port? (Default: 7860 or 8080)
3. CORS configured? (Check `FRONTEND_URL` env var)

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `FRONTEND_URL` matches your frontend origin
2. Check the Rust logs for CORS rejections
3. Ensure the frontend uses the correct API URL
