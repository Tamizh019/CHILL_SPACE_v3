# 🏠 Room System

This document explains how rooms work in Snake Battle.

---

## What is a Room?

A **room** is a private game session where players gather before starting a match. Each room has:

- A unique **6-character code** (e.g., `ABC123`)
- A **room owner** who controls settings
- Up to **4 player slots**
- Customizable **game settings**

---

## Room Lifecycle

```
┌─────────────────────────────────────────┐
│           ROOM CREATED                  │
│   Owner creates room, gets room code    │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           WAITING FOR PLAYERS           │
│   Players join using the room code      │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           LOBBY PHASE                   │
│   Players ready up, owner starts game   │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           GAME IN PROGRESS              │
│   Match is being played                 │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           GAME OVER                     │
│   Winner announced, rematch option      │
└─────────────────────────────────────────┘
```

---

## Room Codes

Room codes are:
- **6 characters long** (letters and numbers)
- **Case insensitive** - `ABC123` = `abc123`
- **Unique** - No two active rooms share the same code
- **Easy to share** - Tell friends verbally or via chat

### Examples
- `SNAKE1`
- `GAME42`
- `XYZ789`

---

## How Joining Works

### Quick Match
1. You click "Quick Match"
2. Server looks for a public room with space
3. If found → You join that room
4. If not found → Server creates a new room for you

### Create Room
1. You configure your settings
2. Click "Create Room"
3. Server generates a unique room code
4. You become the room owner
5. Share the code with friends!

### Join Room
1. Friend gives you the room code
2. You enter the code and click "Join"
3. Server finds the room
4. You join as a player

---

## Room Settings

The room owner can configure:

| Setting | Options | Description |
|---------|---------|-------------|
| **Players** | 2, 3, 4 | Max players allowed |
| **Speed** | Slow, Normal, Fast | How fast snakes move |
| **Map Size** | Small, Medium, Large | Arena dimensions |
| **Power-ups** | On / Off | Whether power-ups spawn |

---

## The Lobby

Once in a room, you enter the **Lobby**:

- See all connected players
- See your assigned snake color
- Click "Ready" when you're prepared to play
- The game starts when **all players are ready**

---

## What Happens When Someone Leaves?

- **Before game starts**: Player slot becomes available
- **During game**: That player's snake stops moving (becomes an obstacle)
- **Room owner leaves**: Room is closed, everyone returns to menu

---

## Room Cleanup

Rooms are automatically removed when:
- All players leave
- The room has been empty for too long
- The server restarts

This keeps the server clean and efficient!
