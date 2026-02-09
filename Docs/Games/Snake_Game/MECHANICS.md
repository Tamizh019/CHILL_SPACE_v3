# ⚙️ Game Mechanics

This document explains the core mechanics of Snake Battle.

---

## The Game Loop

The server runs a **game loop** that updates ~7 times per second:

```
Every 150 milliseconds:
  1. Move all snakes forward
  2. Check for food collection
  3. Check for power-up collection
  4. Check for collisions
  5. Spawn new food/power-ups if needed
  6. Send updated state to all players
```

---

## Snake Movement

### How Snakes Move
- Snakes move automatically in their current direction
- You can only change direction (not stop)
- You cannot reverse (moving right → can't go left immediately)

### Speed Settings
| Setting | Tick Rate | Feel |
|---------|-----------|------|
| Slow | 200ms | Relaxed, beginner-friendly |
| Normal | 150ms | Standard gameplay |
| Fast | 100ms | Intense, requires quick reflexes |

---

## Collision Rules

### 💀 You Die When:

1. **Wall collision** - Hit the arena boundary
2. **Self collision** - Run into your own tail
3. **Head-to-body** - Your head hits another snake's body

### 🤝 Head-to-Head Collision:
When two snake heads collide:
- **Both snakes die** (it's a tie between them)

### 🛡️ Exceptions:
- **Shield power-up** - Survive one collision
- **Ghost power-up** - Pass through other snakes

---

## Food System

### How Food Works
- One food item exists at a time
- Appears at a random empty location
- Eating food makes your snake grow by 1 segment

### Food Respawn
When food is eaten:
1. Player's snake grows
2. New food spawns immediately
3. New position is always in an empty spot

---

## Scoring

| Action | Points |
|--------|--------|
| Eat food | +10 |
| Survive longer | Matters for winning |
| Kill opponent (they hit you) | Bragging rights! |

The **winner** is the last snake alive, not necessarily the highest score.

---

## Power-up System

### Spawn Rate
- Power-ups spawn every **10 seconds** (when enabled)
- Only one power-up exists at a time
- Random type each time

### Power-up Types

#### ⚡ Speed Boost
- **Effect**: Move 50% faster than others
- **Duration**: 5 seconds
- **Strategy**: Great for grabbing food quickly

#### 🛡️ Shield
- **Effect**: Survive your next collision
- **Duration**: Until you get hit once
- **Strategy**: Play more aggressively!

#### 🌱 Grow
- **Effect**: Instantly add 3 segments
- **Duration**: Instant (permanent growth)
- **Strategy**: Get longer without needing food

#### 👻 Ghost
- **Effect**: Pass through other snakes
- **Duration**: 5 seconds
- **Strategy**: Cut through enemies safely

---

## Map Sizes

| Size | Dimensions | Tiles | Best For |
|------|------------|-------|----------|
| Small | 40 × 30 | 1,200 | Quick games, 2 players |
| Medium | 50 × 35 | 1,750 | Balanced, 2-3 players |
| Large | 60 × 40 | 2,400 | Long games, 4 players |

---

## Game Phases

```
LOBBY → COUNTDOWN → PLAYING → GAME_OVER
  ↑                              │
  └──────── (Play Again) ────────┘
```

### Lobby
- Players join and ready up
- Game starts when everyone is ready

### Countdown
- 3... 2... 1... GO!
- Snakes cannot move yet
- Builds anticipation

### Playing
- Active gameplay
- All mechanics active

### Game Over
- Winner announced
- Option to play again
- Option to return to menu

---

## Snake Colors

Each player gets a unique color:

| Player | Color |
|--------|-------|
| Player 1 | 🟢 Green |
| Player 2 | 🔵 Blue |
| Player 3 | 🟡 Yellow |
| Player 4 | 🟣 Purple |

Colors are assigned in join order and persist for the session.

---

## Fair Play

The server is the **single source of truth**:
- All collision detection happens on the server
- All randomness (food, power-ups) is server-controlled
- Clients just render what the server tells them

This prevents cheating and ensures fair gameplay for everyone!
