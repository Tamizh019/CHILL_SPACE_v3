
# 🌌 Chill Space v3

> **Your all-in-one collaboration hub.**  
> *Connect your crew. Collaborate on projects. Play games. Chill together.*

> 🔴 **Live Demo**: [Check out the progress](https://tamizh-loginpage.netlify.app/) *(Backend Integration Coming Soon)*

---

> [!IMPORTANT]
> **CURRENTLY UNDER ACTIVE DEVELOPMENT**
>
> I am currently working Core UI/UX and polishing is ongoing. Auth + real-time chat are completed. Next milestone is integrating core Rust backend services for performance and advanced features.

---

## 🚀 Overview

**Chill Space v3** is the next evolution of digital hangouts. It's not just a chat app; it's a dedicated platform for student groups, friends, and project teams to collaborate, code, and relax. 

We are building a premium, high-aesthetic environment where productivity meets vibes.

---

## ✨ Features (Current & In-Development)

### 🎨 Aesthetics & UI
> *Modern, dark-themed UI with premium glassmorphism.*
- **Deep Dark Theme**: Immersive `#0a0a0a` background with vibrant violet/purple accents (`#8b5cf6`).
- **Glassmorphism**: Premium frosted glass effects on cards, modals, and overlays.
- **Fluid Animations**: Powered by Framer Motion for smooth transitions, hover effects, and micro-interactions.
- **Micro-Interactions**: Hover states, clicking animations, and dynamic tooltips make the app feel alive.

### 🔐 Enhanced Security & Profile
> *Robust protection for user data and identity.*
- **Reauthentication Guard Rails**: Sensitive actions (Password Change, Account Deletion) require verification.
- **Secure Email Updates**: Read-only defaults with a verification loop for email changes.
- **Customizable Profiles**:
  - Avatar Uploads to Supabase Storage.
  - Role Badges (Admin, Moderator, Member).
  - "Danger Zone" management.

### 🧘 Focus & Productivity
> *Stay in the zone with Gamified Focus.*
- **Databased-Backed Streaks**: Focus streaks and "Time Focused" stats are now persisted in Supabase (moved away from localStorage).
- **Daily Goals**: Track your daily focus targets.
- **Focus Timer**: Dedicated distraction-free timer mode.

### 🛠 Collaboration & Social
#### 📢 Real-time Chat (Live)
- **Instant Messaging**: Public Spaces and Private DMs powered by Supabase Realtime.
- **Rich Media**:
  - **File Previews**: Native support for PDF and Text file previews directly in chat.
  - **Mention System**: Tag files or users seamlessly.
- **Enhanced Reactions**: Smart Emoji Picker with active state highlighting.
- **Message Controls**: Edit/Delete history, Reply threads, and "Jump to Message".

#### 👥 Friends & Activity
- **"The Buzz" Feed**: Real-time activity feed showing what friends are up to.
- **Game Integration**: Scores from "Galaxy Match" and other games sync to your profile and feed.
- **Online Presence**: Real-time status indicators.

### 🚀 Onboarding Flow
- **Seamless Entry**: New users are guided through a personalized onboarding experience to set up their profile and preferences immediately after signup.

---

## 🏗 Tech Stack

**Frontend** (In Progress)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
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
