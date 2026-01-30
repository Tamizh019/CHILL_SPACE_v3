# 08 - Focus Mode & Pomodoro Timer

> Build focus tools for distraction-free productivity.

---

## 🎯 Objective

- Pomodoro timer (25/5 technique)
- Customizable focus sessions
- Ambient sounds integration
- Focus statistics tracking

---

## 📦 Dependencies

```bash
npm install zustand howler
```

---

## 🔧 Implementation

### Focus Store (Zustand)

```typescript
// hooks/useFocusStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FocusPhase = 'focus' | 'shortBreak' | 'longBreak' | 'idle';

interface FocusState {
  phase: FocusPhase;
  timeRemaining: number;
  isRunning: boolean;
  sessionsCompleted: number;
  settings: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  };
  
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      phase: 'idle',
      timeRemaining: 25 * 60,
      isRunning: false,
      sessionsCompleted: 0,
      settings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
      },

      startTimer: () => set({ isRunning: true, phase: get().phase === 'idle' ? 'focus' : get().phase }),
      pauseTimer: () => set({ isRunning: false }),
      resetTimer: () => set({ phase: 'idle', timeRemaining: 25 * 60, isRunning: false }),
      
      tick: () => {
        const { timeRemaining, isRunning, phase, settings, sessionsCompleted } = get();
        if (!isRunning || timeRemaining <= 0) return;
        
        if (timeRemaining - 1 <= 0) {
          // Phase complete - switch phases
          if (phase === 'focus') {
            const isLongBreak = (sessionsCompleted + 1) % 4 === 0;
            set({
              phase: isLongBreak ? 'longBreak' : 'shortBreak',
              timeRemaining: (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60,
              sessionsCompleted: sessionsCompleted + 1,
            });
          } else {
            set({ phase: 'focus', timeRemaining: settings.focusDuration * 60 });
          }
        } else {
          set({ timeRemaining: timeRemaining - 1 });
        }
      },
    }),
    { name: 'focus-storage' }
  )
);
```

### Pomodoro Timer Component

```tsx
// components/focus/PomodoroTimer.tsx
'use client';
import { useEffect } from 'react';
import { useFocusStore } from '@/hooks/useFocusStore';

export function PomodoroTimer() {
  const { phase, timeRemaining, isRunning, startTimer, pauseTimer, resetTimer, tick } = useFocusStore();

  useEffect(() => {
    const interval = setInterval(() => isRunning && tick(), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <h2 className="text-2xl font-bold text-white">
        {phase === 'focus' ? '🎯 Focus' : phase === 'shortBreak' ? '☕ Break' : '🌴 Long Break'}
      </h2>
      <span className="text-7xl font-bold text-white font-mono">{formattedTime}</span>
      <div className="flex gap-4">
        <button onClick={isRunning ? pauseTimer : startTimer} className="px-8 py-3 bg-primary rounded-xl">
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={resetTimer} className="px-6 py-3 bg-white/10 rounded-xl">↺ Reset</button>
      </div>
    </div>
  );
}
```

### Ambient Sounds

```tsx
// components/focus/AmbientSounds.tsx
'use client';
import { useState } from 'react';
import { Howl } from 'howler';

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: '🌧️', src: '/sounds/rain.mp3' },
  { id: 'fire', name: 'Fire', icon: '🔥', src: '/sounds/fire.mp3' },
  { id: 'lofi', name: 'Lo-Fi', icon: '🎵', src: '/sounds/lofi.mp3' },
];

export function AmbientSounds() {
  const [active, setActive] = useState<Map<string, Howl>>(new Map());

  const toggle = (sound: typeof SOUNDS[0]) => {
    if (active.has(sound.id)) {
      active.get(sound.id)?.stop();
      const m = new Map(active);
      m.delete(sound.id);
      setActive(m);
    } else {
      const howl = new Howl({ src: [sound.src], loop: true, volume: 0.5 });
      howl.play();
      setActive(new Map(active.set(sound.id, howl)));
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {SOUNDS.map((s) => (
        <button key={s.id} onClick={() => toggle(s)}
          className={`p-4 rounded-xl ${active.has(s.id) ? 'bg-primary/20 border-primary' : 'bg-white/5'}`}>
          <span className="text-2xl">{s.icon}</span>
          <span className="text-xs">{s.name}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## ✅ Features

- [x] Pomodoro timer
- [x] Ambient sounds
- [x] Session stats
- [ ] Notifications
- [ ] Weekly reports

---

## 📝 Next: [09_VOICE_VIDEO.md](./09_VOICE_VIDEO.md)
