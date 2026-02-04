# Monaco Editor & Rust Backend - Complete Guide

> **Understanding how the Code Playground works: Frontend vs Backend**

---

## 🤔 The Big Question

**"Monaco Editor supports 40+ languages. Do I just need to add something in the frontend, or do I need to modify the Rust backend too?"**

**Short Answer:** You need to modify **BOTH** the frontend and the backend.

**Why?** Monaco Editor only provides the **editing experience**. Your Rust backend does the **actual code execution**.

---

## 🎨 What Monaco Editor Does (Frontend)

Monaco Editor is the **same editor that powers VS Code**. It's a React component that gives you:

### ✅ What's Built-In (No Extra Work)

| Feature | Description |
|---------|-------------|
| **Syntax Highlighting** | Colors for keywords, strings, comments (40+ languages) |
| **Autocomplete** | IntelliSense suggestions as you type |
| **Error Detection** | Red squiggly lines for syntax errors |
| **Code Formatting** | Auto-indent, bracket matching |
| **Themes** | Dark mode, light mode, custom themes |

### 🎯 What Monaco Editor Does NOT Do

❌ **Execute code** - It's just a text editor  
❌ **Compile code** - No compiler built-in  
❌ **Run programs** - Can't interact with system runtimes  
❌ **Install dependencies** - No package manager  

**Think of Monaco as a fancy notepad.** It makes writing code beautiful, but it can't run anything.

---

## ⚙️ What the Rust Backend Does

Your Rust backend (Actix-Web) is the **execution engine**. It:

1. **Receives code** from the frontend as a string
2. **Writes it to a temporary file** on the server
3. **Runs the appropriate compiler/interpreter**:
   - Python → `python3 script.py`
   - Java → `javac Main.java && java Main`
   - JavaScript → `node script.js`
4. **Captures output** (stdout, stderr, exit code)
5. **Sends results back** to the frontend

### 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Timeout** | Kills process after 10 seconds |
| **Code Size Limit** | Max 50KB input |
| **Output Limit** | Max 100KB output |
| **Sandboxing** | Subprocess isolation |

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER WRITES CODE                              │
│                                                                  │
│  const greeting = "Hello, Chill Space!";                        │
│  console.log(greeting);                                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              MONACO EDITOR (Frontend - React)                    │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Syntax highlighting (JavaScript detected)                   │
│  ✅ Autocomplete for 'console.log'                              │
│  ✅ Bracket matching                                            │
│  ✅ Line numbers, minimap                                       │
│                                                                  │
│  ❌ Does NOT execute the code                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ User clicks "Run Code" button
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND SENDS HTTP REQUEST                         │
├─────────────────────────────────────────────────────────────────┤
│  POST https://your-backend.hf.space/api/v1/code/run             │
│                                                                  │
│  Body:                                                           │
│  {                                                               │
│    "language": "javascript",                                    │
│    "code": "const greeting = ...; console.log(greeting);"       │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           RUST BACKEND (Actix-Web Server)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Receives JSON request                                       │
│  2. Validates language is supported                             │
│  3. Creates temp file: /tmp/script_abc123.js                    │
│  4. Writes code to file                                         │
│  5. Executes: `node /tmp/script_abc123.js`                      │
│  6. Captures output with 10s timeout                            │
│  7. Cleans up temp file                                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM RUNTIME (Node.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  $ node /tmp/script_abc123.js                                   │
│  > Hello, Chill Space!                                          │
│                                                                  │
│  Exit Code: 0                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              RUST BACKEND RESPONDS                               │
├─────────────────────────────────────────────────────────────────┤
│  {                                                               │
│    "stdout": "Hello, Chill Space!\n",                           │
│    "stderr": "",                                                │
│    "exit_code": 0,                                              │
│    "duration_ms": 45                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND DISPLAYS OUTPUT                            │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Success (45ms)                                              │
│                                                                  │
│  Output:                                                         │
│  Hello, Chill Space!                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Adding a New Language

Let's say you want to add **TypeScript** support. Here's what you need to do:

### Step 1: Frontend Changes (Easy!)

**File:** `Frontend/src/app/(dashboard)/code/page.tsx`

```typescript
const LANGUAGES = [
    // ... existing languages
    { 
        id: 'typescript', 
        name: 'TypeScript', 
        IconComponent: LanguageIcons.typescript, 
        extension: '.ts', 
        status: 'available',  // ← Change from 'coming_soon' to 'available'
        monacoLang: 'typescript',  // ← Monaco already knows TypeScript!
        defaultCode: '// Write TypeScript code\nconst greeting: string = "Hello!";\nconsole.log(greeting);' 
    },
];
```

**That's it for the frontend!** Monaco Editor already has TypeScript syntax highlighting built-in. You just need to enable it.

### Step 2: Backend Changes (Requires Work)

**File:** `backend/src/code_runner.rs`

You need to add execution logic:

```rust
pub fn execute_code(language: &str, code: &str) -> Result<Output, String> {
    match language {
        "python" => { /* existing Python logic */ },
        "java" => { /* existing Java logic */ },
        "javascript" => { /* existing JavaScript logic */ },
        
        // NEW: Add TypeScript support
        "typescript" => {
            // 1. Write code to temp file
            let temp_file = format!("/tmp/script_{}.ts", generate_random_id());
            fs::write(&temp_file, code)?;
            
            // 2. Compile TypeScript to JavaScript
            let compile = Command::new("tsc")
                .arg(&temp_file)
                .arg("--outDir")
                .arg("/tmp")
                .output()?;
            
            if !compile.status.success() {
                return Err(String::from_utf8_lossy(&compile.stderr).to_string());
            }
            
            // 3. Run the compiled JavaScript
            let js_file = temp_file.replace(".ts", ".js");
            let output = Command::new("node")
                .arg(&js_file)
                .timeout(Duration::from_secs(10))
                .output()?;
            
            // 4. Clean up
            fs::remove_file(&temp_file)?;
            fs::remove_file(&js_file)?;
            
            Ok(output)
        },
        
        _ => Err(format!("Unsupported language: {}", language))
    }
}
```

### Step 3: Install Runtime on Server

Your Rust backend server needs the TypeScript compiler installed:

```bash
# On your Hugging Face Space or server
npm install -g typescript
```

**Update Dockerfile:**

```dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    python3 \
    default-jdk \
    nodejs \
    npm

# Install TypeScript globally
RUN npm install -g typescript

COPY --from=builder /app/target/release/backend /app/backend
CMD ["/app/backend"]
```

---

## 📊 Language Support Matrix

| Language | Monaco Syntax | Backend Runtime | Status |
|----------|---------------|-----------------|--------|
| **Python** | ✅ Built-in | ✅ `python3` | 🟢 Available |
| **Java** | ✅ Built-in | ✅ `javac + java` | 🟢 Available |
| **JavaScript** | ✅ Built-in | ✅ `node` | 🟢 Available |
| **TypeScript** | ✅ Built-in | ❌ Need `tsc + node` | 🟡 Coming Soon |
| **Rust** | ✅ Built-in | ❌ Need `rustc` | 🟡 Coming Soon |
| **Go** | ✅ Built-in | ❌ Need `go run` | 🟡 Coming Soon |
| **C++** | ✅ Built-in | ❌ Need `g++` | 🟡 Coming Soon |

**Key Insight:** Monaco supports all these languages for **editing**. You just need to add **execution** logic in Rust.

---

## 🎯 Common Misconceptions

### ❌ Myth 1: "Monaco Editor runs the code"
**Reality:** Monaco is just a text editor. It's like Microsoft Word for code—it makes it look pretty but can't execute anything.

### ❌ Myth 2: "If Monaco supports a language, I can run it"
**Reality:** Monaco gives you syntax highlighting for free, but YOU must implement execution in the backend.

### ❌ Myth 3: "I need to configure Monaco for each language"
**Reality:** Monaco already knows 40+ languages. Just set `monacoLang: 'python'` and it works automatically.

---

## 🔍 Real-World Example

Let's trace what happens when a user runs Python code:

### User Action
```python
print("Hello, World!")
```

### Frontend (Monaco Editor)
```typescript
// Monaco provides:
- Blue color for 'print' keyword
- Green color for "Hello, World!" string
- Autocomplete suggestions
- Parenthesis matching

// Monaco sends to backend:
fetch('/api/v1/code/run', {
    body: JSON.stringify({
        language: 'python',
        code: 'print("Hello, World!")'
    })
})
```

### Backend (Rust)
```rust
// 1. Create temp file
/tmp/script_a1b2c3.py

// 2. Write code
fs::write("/tmp/script_a1b2c3.py", "print(\"Hello, World!\")")?;

// 3. Execute
Command::new("python3")
    .arg("/tmp/script_a1b2c3.py")
    .output()?;

// 4. Capture output
stdout: "Hello, World!\n"
stderr: ""
exit_code: 0

// 5. Send response
{
    "stdout": "Hello, World!\n",
    "stderr": "",
    "exit_code": 0,
    "duration_ms": 42
}
```

### Frontend (Display)
```
✅ Success (42ms)

Output:
Hello, World!
```

---

## 🛠 Debugging Tips

### Frontend Issues

**Problem:** Language doesn't show syntax highlighting

**Solution:** Check `monacoLang` value matches Monaco's language ID:
```typescript
// Correct
monacoLang: 'python'  // ✅

// Wrong
monacoLang: 'py'      // ❌ Monaco doesn't recognize 'py'
```

**Monaco Language IDs:** `python`, `javascript`, `typescript`, `java`, `rust`, `go`, `cpp`, `csharp`, `php`, `ruby`, `swift`, etc.

### Backend Issues

**Problem:** Code doesn't execute

**Checklist:**
1. ✅ Is the runtime installed? (`python3 --version`)
2. ✅ Is the language case in `code_runner.rs` correct?
3. ✅ Are temp files being created? (Check `/tmp`)
4. ✅ Is the timeout sufficient? (10 seconds default)
5. ✅ Check Rust logs for errors

---

## 📚 Summary

| Component | Role | Analogy |
|-----------|------|---------|
| **Monaco Editor** | Provides beautiful code editing UI | Like Microsoft Word for code |
| **Frontend (Next.js)** | Sends code to backend, displays results | Like a messenger |
| **Rust Backend** | Actually executes the code | Like a chef cooking the recipe |
| **System Runtime** | Runs the program (python3, node, etc.) | Like the kitchen equipment |

### The Golden Rule

> **Monaco handles the EDITING experience (40+ languages built-in).**  
> **Your Rust backend handles the EXECUTION (you must implement each language).**

---

## 🎓 Next Steps

1. **Explore Monaco Options:** Check out [Monaco Editor Playground](https://microsoft.github.io/monaco-editor/playground.html)
2. **Add More Languages:** Start with TypeScript (easiest) or Go (medium difficulty)
3. **Improve Security:** Add Docker containers for better sandboxing
4. **Add Features:** Code formatting, linting, multi-file support

---

**Questions?** Check the other docs:
- [CODE_EDITOR.md](./CODE_EDITOR.md) - Code Playground architecture
- [RUST_BACKEND.md](./RUST_BACKEND.md) - Backend deployment guide

---

*Built with 💜 by Tamizh*
