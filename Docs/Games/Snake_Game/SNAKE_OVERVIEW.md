# 🐍 Snake Battle - Overview

Welcome to Snake Battle! This document explains how our multiplayer snake game works.

## What is Snake Battle?

Snake Battle is a real-time multiplayer game where up to 4 players compete in an arena. Each player controls a snake that grows when eating food. The goal is to be the last snake standing!

---

## Game Modes

### 🎮 Quick Match
Jump straight into a game! The system finds an available room or creates a new one for you.

### 🏠 Create Room
Host your own private game:
- Set the number of players (2, 3, or 4)
- Choose game speed (Slow, Normal, Fast)
- Pick map size (Small, Medium, Large)
- Enable/disable power-ups

### 🔗 Join Room
Enter a 6-character room code to join a friend's game.

### 🤖 Solo Mode
Play against AI bots to practice your skills!
- **Easy:** Good for beginners, casual random movement
- **Medium:** Smart food seeking and wall avoidance
- **Hard:** Advanced pathfinding and strategic gameplay

---

## How to Play

| Control | Action |
|---------|--------|
| ↑ Arrow | Move Up |
| ↓ Arrow | Move Down |
| ← Arrow | Move Left |
| → Arrow | Move Right |
| Space | Ready Up (in Lobby) |
| R | Request Rematch |

---

## Game Flow

```
1. Enter Room (Quick Match / Create / Join)
         ↓
2. Wait in Lobby (Ready Up)
         ↓
3. Countdown (3... 2... 1... GO!)
         ↓
4. Game Starts - Collect food, avoid crashes!
         ↓
5. Game Over - Last snake wins!
         ↓
6. Play Again or Return to Menu
```

---

## Power-ups

When enabled, power-ups spawn every 10 seconds:

| Power-up | Effect | Duration |
|----------|--------|----------|
| ⚡ Speed Boost | Move 50% faster | 5 seconds |
| 🛡️ Shield | Survive one crash | Until hit |
| 🌱 Grow | Instantly grow +3 segments | Instant |
| 👻 Ghost | Pass through other snakes | 5 seconds |

---

## Tips for New Players

1. **Don't rush** - The game gets harder as your snake grows
2. **Use the walls** - Learn to navigate tight spaces
3. **Watch your opponents** - Predict where they're going
4. **Grab power-ups** - They can turn the game around!

---

## Next Steps

- [How Rooms Work](./ROOMS.md) - Understanding the room system
- [Real-time Connection](./WEBSOCKET.md) - How game data syncs
- [Game Mechanics](./MECHANICS.md) - Collision, scoring, and more
- [Solo Mode AI](./SOLO_MODE.md) - How the AI works
