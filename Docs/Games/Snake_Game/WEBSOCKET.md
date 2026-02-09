# 🔌 Real-time Connection (WebSocket)

This document explains how Snake Battle maintains real-time communication between players.

---

## Why Real-time Matters

In a multiplayer game, every player needs to see:
- Where other snakes are moving
- When food appears or gets eaten
- When power-ups spawn
- Who crashed or won

This all happens **instantly** - no page refreshes needed!

---

## What is a WebSocket?

A **WebSocket** is like a phone call between your browser and the server:

| Regular HTTP Request | WebSocket Connection |
|---------------------|---------------------|
| Ask → Wait → Get answer | Always connected |
| One question at a time | Continuous conversation |
| You ask, server answers | Both can talk anytime |

Think of it like:
- **HTTP** = Sending letters back and forth 📬
- **WebSocket** = Having a phone call 📞

---

## How Connection Works

```
┌──────────────┐                    ┌──────────────┐
│   Browser    │                    │   Server     │
│  (Frontend)  │                    │  (Backend)   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ 1. "I want to join room ABC123"   │
       │ ─────────────────────────────────>│
       │                                   │
       │ 2. "Welcome! Here's the room"     │
       │ <─────────────────────────────────│
       │                                   │
       │ 3. "I'm pressing UP arrow"        │
       │ ─────────────────────────────────>│
       │                                   │
       │ 4. "Here's the new game state"    │
       │ <─────────────────────────────────│
       │                                   │
       │    (This continues throughout     │
       │     the entire game...)           │
       │                                   │
```

---

## Connection States

Your connection can be in these states:

| State | Meaning | What You See |
|-------|---------|--------------|
| 🟢 **Connected** | Everything working | Game plays normally |
| 🟡 **Connecting** | Establishing connection | Loading indicator |
| 🔴 **Disconnected** | Lost connection | Error message |

---

## Messages Between Client & Server

### You → Server (Your Actions)

| Message | When |
|---------|------|
| `Join` | When you enter a room |
| `Move` | When you press arrow keys |
| `Ready` | When you're ready to play |
| `PlayAgain` | When you want a rematch |

### Server → You (Game Updates)

| Message | When |
|---------|------|
| `Welcome` | When you successfully join |
| `GameState` | Every game tick (~150ms) |
| `PlayerJoined` | When someone joins |
| `PlayerLeft` | When someone leaves |
| `GameOver` | When the game ends |

---

## Game State Updates

The server sends a complete **Game State** about 7 times per second:

```
Game State contains:
├── All snake positions
├── All snake directions
├── Food location
├── Power-up locations
├── Active power-up effects
├── Current game phase
└── Score information
```

This ensures everyone sees the exact same game at all times!

---

## What Happens When You Disconnect?

1. **Brief disconnect** (few seconds)
   - Server waits for you to reconnect
   - Your snake keeps moving in its last direction

2. **Long disconnect** (timeout)
   - Server removes you from the game
   - Your snake becomes an obstacle
   - Other players continue

---

## Why This Matters for Gameplay

The WebSocket connection enables:

- **Instant movement** - Press a key, see it happen immediately
- **Fair play** - Everyone gets the same game state
- **Smooth experience** - No lag or stuttering
- **Live updates** - See other players move in real-time

---

## Technical Note

The WebSocket URL looks like:
```
ws://localhost:8080/api/v1/games/snake/ws/ABC123
                                         ^^^^^^
                                         Room code
```

Each room has its own WebSocket endpoint, so games stay isolated!
