# 🌌 Chill Space v3

> **The ultimate collaboration hub for builders, gamers, and friends.**
> *Connect. Code. Vibe.*

🔴 **[Live Demo](https://tamizh-loginpage.netlify.app/)** *(Backend Integration In Progress)*

---

## 🎯 The Vision
We're not just building a chat app. We're building a **high-performance digital workspace** that feels like a premium desktop experience. No lag, no clutter—just pure productivity and vibes.

---

## ✅ Features

### 🎨 **Ultra-Premium UI**
- **Glassmorphism everywhere:** Frosted glass cards, modals, and sidebars
- **Deep Dark Mode:** `#0a0a0a` background with `#8b5cf6` (Violet) accents
- **Fluid Animations:** Powered by **Framer Motion** for a native feel
- **Consistent Theming:** Arcade, Code, Chat, and Focus pages all share the same aesthetic

### ⚡ **Global Performance Store**
- **Zero-Lag Navigation:** Instant switching between sections
- **Global Caching:** Custom `GlobalStoreContext` for intelligent data caching
- **Optimized Rendering:** No unnecessary re-renders or hydration errors

### 💬 **Real-Time Communication**
- **Live Chat:** Powered by **Supabase Realtime**
- **Rich Media:** Send PDFs, images, and text files with instant previews
- **Smart Mentions:** Tag users `@tamizh` or files `@[notes.pdf]` instantly
- **Direct Messages:** Private 1-on-1 conversations with unread indicators

### 💻 **Code Playground** *(NEW!)*
- **Multi-Language Support:** Python, Java, JavaScript (TypeScript, Rust, Go, C++ coming soon)
- **Monaco Editor:** VS Code-quality editing experience
- **Rust Backend:** High-performance code execution via Actix-Web
- **Modern UI:** Compact language switcher with real SVG logos
- **Error Parsing:** Beautiful, readable error displays

### 🎮 **Arcade Center**
- **Galaxy Match:** Memory puzzle game with cosmic theme
- **More Coming:** Word Chain, Code Trivia, Typing Race

### 🧘 **Focus Mode**
- **Gamified Productivity:** Earn XP for staying focused
- **Streak Tracking:** Persistent data storage

### 🔒 **Security**
- **Protected Routes:** All dashboard pages (`/home`, `/chat`, `/code`, `/games`, `/focus`, `/profile`) require authentication
- **Middleware Security:** Next.js middleware redirects unauthenticated users to login

---

## 🏗 Tech Stack

| Component | Tech |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind v4 |
| **Animations** | Framer Motion |
| **Editor** | Monaco Editor |
| **Database** | Supabase (Postgres, Auth, Realtime) |
| **Backend** | **Rust (Actix-Web)** - Code execution service |
| **State** | Custom Global Store (Context API) |

---

## � Project Structure

```
CHILL-SPACE v3/
├── Frontend/          # Next.js application
│   ├── src/app/       # App Router pages
│   │   ├── (auth)/    # Login, Signup
│   │   └── (dashboard)/ # Protected routes
│   │       ├── home/
│   │       ├── chat/
│   │       ├── code/    # Code Playground
│   │       ├── games/   # Arcade Center
│   │       ├── focus/
│   │       └── profile/
│   └── src/utils/     # Utilities & middleware
├── backend/           # Rust Actix-Web API
│   └── src/           # Code runner service
├── Docs/              # Technical documentation
└── Mobile/            # React Native app
```

---

## 🔧 Developer Notes

### Getting Started

```bash
# Frontend
cd Frontend
npm install
npm run dev

# Backend (requires Rust)
cd backend
cargo run
```

### Environment Variables

Copy `frontend.env.example` to `.env.local` in the Frontend folder and fill in your Supabase credentials.

### Supabase Type Generation

```bash
npx supabase login
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### Hugging Face Deployment (Backend)

```bash
git add .
git commit -m "feat: backend updates"
git subtree pull --prefix backend hf main --squash
git subtree push --prefix backend hf main
```

---

## 📚 Documentation

See the `Docs/` folder for detailed technical documentation:
- [Code Editor Architecture](./Docs/CODE_EDITOR.md) - How the Code Playground works
- [Rust Backend Integration](./Docs/RUST_BACKEND.md) - Frontend-Backend communication

---

*Built with 💜 by Tamizh*
