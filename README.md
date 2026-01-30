
# 🌌 Chill Space v3

> **Your all-in-one collaboration hub.**  
> *Connect your crew. Collaborate on projects. Play games. Chill together.*

> 🔴 **Live Demo**: [Check out the progress](https://chill-space.netlify.app/) *(Backend Integration Coming Soon)*

---

> [!IMPORTANT]
> **CURRENTLY UNDER ACTIVE DEVELOPMENT**
>
> I am currently working Core UI/UX and polishing is ongoing. Auth + real-time chat are completed. Next milestone is integrating core Rust backend services for performance and advanced features.

---

## 🚀 Overview

**Chill Space v3** is the next evolution of digital hangouts. It's not just a chat app; it's a dedicated platform for student groups, friends, and project teams to collaborate, code, and relax. 

We are building a premium, high-aesthetic environment where productivity meets vibes.

## ✨ Features (Current & In-Development)

### 🎨 Aesthetics & UI
> *Modern, dark-themed UI with premium glassmorphism.*
- **Deep Dark Theme**: Immersive `#0a0a0a` background with vibrant violet/purple accents (`#8b5cf6`).
- **Glassmorphism**: Premium frosted glass effects on cards, modals, and overlays.
- **Fluid Animations**: Powered by Framer Motion for smooth transitions, hover effects, and micro-interactions.
- **Micro-Interactions**: Hover states, clicking animations, and dynamic tooltips make the app feel alive.

### 🛠 Collaboration Tools

#### 📢 Real-time Chat (Live)
- **Instant Messaging**: Public Spaces and Private DMs powered by Supabase Realtime.
- **Enhanced Reactions System**: 
  - Smart Emoji Picker with active state highlighting.
- **Message Features**: 
  - Edit/Delete messages with history tracking.
  - Link previews for rich content sharing.
  - Reply threads / "Jump to Message".
- **Server Stats Widget**: Real-time insights on community activity (Members, Messages Today, Active Channels).

#### 👥 Presence & Community (Live)
- **Online Members**: See who's active in real-time.
- **User Profiles**: Custom avatars and status indicators.

#### 📚 Premium Features (Planned)
- **💻 Code Editor**: Built-in environment for collaborative coding sessions. (Planned)
- **📁 Project Spaces**: Dedicated vaults for files, threads, and college project management. (Planned)
- **🎮 Interactive Games**: Mini-games to take a break and bond with your team. (Planned)


### 🏗 Tech Stack

**Frontend** (In Progress)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

**Backend & Infrastructure** (Implemented)
- **Core Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage)
- **Microservices**: [Rust](https://www.rust-lang.org/) (Planned)
    - *Code Runner*: Secure sandbox for executing user code.
    - *Game Server*: High-performance WebSocket server for real-time gaming.
    - *Collab Engine*: CRDT-based operational transformation for shared editing.

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
