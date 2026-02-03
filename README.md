# 🌌 Chill Space v3

> **The ultimate collaboration hub for builders, gamers, and friends.**
> *Connect. Code. Vibe.*

🔴 **[Live Demo](https://tamizh-loginpage.netlify.app/)** *(Backend Integration In Progress)*

---

## 🎯 The Vision
We're not just building a chat app. We're building a **high-performance digital workspace** that feels like a premium desktop experience. No lag, no clutter—just pure productivity and vibes.

---

## ✅ What We Built (So Far)

### 🎨 **Ultra-Premium UI**
- **Glassmorphism everywhere:** Frosted glass cards, modals, and sidebars.
- **Deep Dark Mode:** `#0a0a0a` background with `#8b5cf6` (Violet) accents.
- **Fluid Animations:** Powered by **Framer Motion** for a native feel.

### ⚡ **Global Performance Store**
- **Zero-Lag Navigation:** Switching between Chat, Home, and Profile is instant.
- **Global Caching:** We built a custom `GlobalStoreContext` that intelligently caches user data, ensuring the app feels faster than light.
- **Optimized Rendering:** No unnecessary re-renders or hydration errors.

### 💬 **Real-Time Communication**
- **Live Chat:** Powered by **Supabase Realtime**.
- **Rich Media:** Send PDFs, images, and text files with instant previews.
- **Smart Mentions:** Tag users `@tamizh` or files `@[notes.pdf]` instantly.

### 🧘 **Focus Mode**
- **Gamified Productivity:** Earn XP for staying focused.
- **Streak Tracking:** Data is persisted to the database, so your streaks are safe.

---

## 🚧 Roadmap (The Fun Stuff)

### 🦀 **Rust Backend Integration (Next Up!)**
We are integrating a high-performance **Rust (Actix-Web)** backend to handle heavy lifting:
- [ ] **Game Server:** Real-time multiplayer logic for arcade games.
- [ ] **Code Runner:** Secure sandbox to execute Python/JS code directly in chat.
- [ ] **CRDT Collaboration:** Google Docs-style live editing.

### 🎮 **Mini-Games**
- **Galaxy Match:** A competitive puzzle game to challenge friends.
- **Typing Racer:** Test your coding speed against the crew.

---

## 🏗 Tech Stack

| Component | Tech |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind v4 |
| **Animations** | Framer Motion |
| **Database** | Supabase (Postgres, Auth, Realtime) |
| **Microservices** | **Rust (Actix-Web)** *[In Development]* |
| **State** | Custom Global Store (Context API) |

---

## 🔧 Developer Notes

### Supabase Type Generation

When you add/change tables or columns in Supabase, regenerate TypeScript types to keep the codebase type-safe:

```bash
# Login to Supabase CLI (one-time setup)
npx supabase login

# Regenerate types from your database schema
npx supabase gen types typescript --project-id cmriyjrqkvpdchvbpnne > src/types/supabase.ts

```

> [!TIP]
> Run this command after any database schema changes to avoid TypeScript build errors.


### 🚀 Hugging Face Deployment (Backend)

Deploy the Rust backend to Hugging Face Spaces using `git subtree`:

```bash
# 1. Commit changes to main repo
git add .
git commit -m "feat: backend updates"

# 2. Pull remote changes first (if any)
git subtree pull --prefix backend hf main --squash

# 3. Push backend folder to Hugging Face
git subtree push --prefix backend hf main
```

> [!TIP]
> Always run `git subtree pull` before `push` to avoid conflicts.

---
##  Getting Started

1. **Frontend:** `npm run dev`
2. **Backend:** `cd backend` -> `cargo run`

---
*Built with 💜 by Tamizh*

