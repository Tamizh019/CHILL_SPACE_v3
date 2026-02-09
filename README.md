# Chill Space v3

> The ultimate collaboration hub for builders, gamers, and friends.
> Connect. Code. Vibe.

[Live Demo](https://tamizh-loginpage.netlify.app/) *(Backend Integration In Progress)*

---

## Overview

Chill Space is a **high-performance digital workspace** that combines real-time communication, a code playground, and multiplayer mini-games into a seamless experience. Built with modern web technologies and a Rust-powered backend.

---

## Features

### Ultra-Premium UI
- Glassmorphism design with frosted glass effects
- Deep dark mode (`#0a0a0a` background, violet accents)
- Fluid animations powered by Framer Motion
- Consistent theming across all pages

### Real-Time Communication
- Live chat powered by Supabase Realtime
- Rich media support (PDFs, images, text files)
- Smart mentions for users (`@tamizh`) and files (`@[notes.pdf]`)
- Direct messages with unread indicators

### Code Playground
- Multi-language support: Python, Java, JavaScript
- VS Code-quality editing with Monaco Editor
- Rust backend for high-performance code execution
- Beautiful error parsing and display

### Arcade Center
- **Snake Battle**: Multiplayer snake game with:
  - Solo Mode against AI bots (Easy, Medium, Hard difficulty)
  - Power-ups: Speed Boost, Shield, Growth, Ghost
  - Real-time multiplayer via room codes
- **Galaxy Match**: Memory puzzle game
- More games coming soon

### Focus Mode
- Gamified productivity with XP rewards
- Streak tracking with persistent storage

### Security
- Protected routes for all dashboard pages
- Next.js middleware for authentication
- Automatic redirects for unauthenticated users

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, Tailwind v4 |
| Animations | Framer Motion |
| Editor | Monaco Editor |
| Database | Supabase (Postgres, Auth, Realtime) |
| Backend | Rust (Actix-Web) - Code execution & Game Server |
| State | Custom Global Store (Context API) |

---

## Project Structure

```
CHILL-SPACE v3/
├── Frontend/              # Next.js application
│   ├── src/app/
│   │   ├── (auth)/        # Login, Signup
│   │   └── (dashboard)/   # Protected routes
│   │       ├── home/
│   │       ├── chat/
│   │       ├── code/
│   │       ├── games/
│   │       ├── focus/
│   │       └── profile/
│   └── src/utils/
├── backend/               # Rust Actix-Web API
│   └── src/
│       └── games/         # Game server (WebSockets)
├── Docs/                  # Technical documentation
└── Mobile/                # React Native app
```

---

## Developer Guide

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

Copy `frontend.env.example` to `.env.local` in the Frontend folder and configure your Supabase credentials.

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

## Documentation

Detailed technical documentation is available in the `Docs/` folder:

- [Code Editor Architecture](./Docs/CODE_EDITOR.md)
- [Rust Backend Integration](./Docs/RUST_BACKEND.md)
- [Snake Game Overview](./Docs/Games/Snake_Game/SNAKE_OVERVIEW.md)
- [Snake Solo Mode AI](./Docs/Games/Snake_Game/SOLO_MODE.md)

---

*Built by Tamizh*
