'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Trophy, Gamepad2, Crown, Skull, Wifi, WifiOff, Play, RotateCcw, User, Bot } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

interface Point {
    x: number;
    y: number;
}

type Direction = 'Up' | 'Down' | 'Left' | 'Right';

interface Snake {
    body: Point[];
    direction: Direction;
    next_direction: Direction;
    alive: boolean;
    score: number;
    color: string;
}

interface Player {
    id: string;
    name: string;
    snake: Snake;
    ready: boolean;
    active_power: ActivePowerUp | null;
}

type GamePhase = 'Lobby' | 'Countdown' | 'Playing' | 'GameOver';

interface GameState {
    phase: GamePhase;
    players: Record<string, Player>;
    food: Point[];
    grid_width: number;
    grid_height: number;
    winner: string | null;
    countdown: number;
    power_ups: PowerUp[];
}

type PowerUpType = 'SpeedBoost' | 'Shield' | 'Grow' | 'Ghost';

interface PowerUp {
    id: string;
    position: Point;
    power_type: PowerUpType;
}

interface ActivePowerUp {
    power_type: PowerUpType;
    ticks_remaining: number;
}

type GameMode = 'Menu' | 'CreateRoom' | 'JoinRoom' | 'Lobby' | 'Playing';

interface RoomSettings {
    max_players: number;
    speed: 'Slow' | 'Normal' | 'Fast';
    power_ups_enabled: boolean;
    rounds: number;
    map_size: 'Small' | 'Medium' | 'Large';
}

interface GameState {
    phase: GamePhase;
    players: Record<string, Player>;
    food: Point[];
    grid_width: number;
    grid_height: number;
    winner: string | null;
    countdown: number;
    power_ups: PowerUp[];
    room_code?: string;
}
type ServerMessage =
    | { type: 'Welcome'; payload: { player_id: string } }
    | { type: 'GameState'; payload: GameState }
    | { type: 'PlayerJoined'; payload: { player_id: string; name: string } }
    | { type: 'PlayerLeft'; payload: { player_id: string } }
    | { type: 'Error'; payload: { message: string } }
    | { type: 'GameStarted' }
    | { type: 'GameOver'; payload: { winner: string | null } };

// =============================================================================
// CONSTANTS
// =============================================================================

const CELL_SIZE = 16;
const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8080/api/v1/games/snake/ws';

// =============================================================================
// GAME CANVAS COMPONENT
// =============================================================================

function GameCanvas({ gameState, playerId }: { gameState: GameState; playerId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = gameState.grid_width * CELL_SIZE;
        const height = gameState.grid_height * CELL_SIZE;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Grid pattern (subtle)
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= gameState.grid_width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, height);
            ctx.stroke();
        }
        for (let y = 0; y <= gameState.grid_height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(width, y * CELL_SIZE);
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);

        // Food - glowing orbs
        gameState.food.forEach((f) => {
            const cx = f.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = f.y * CELL_SIZE + CELL_SIZE / 2;

            // Glow
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL_SIZE);
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
            gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.3)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(f.x * CELL_SIZE - CELL_SIZE / 2, f.y * CELL_SIZE - CELL_SIZE / 2, CELL_SIZE * 2, CELL_SIZE * 2);

            // Core
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE / 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Power-ups - special glowing items
        const powerUpColors: Record<PowerUpType, { main: string; glow: string; icon: string }> = {
            SpeedBoost: { main: '#22d3ee', glow: 'rgba(34, 211, 238, 0.6)', icon: '⚡' },
            Shield: { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)', icon: '🛡️' },
            Grow: { main: '#4ade80', glow: 'rgba(74, 222, 128, 0.6)', icon: '📏' },
            Ghost: { main: '#e879f9', glow: 'rgba(232, 121, 249, 0.6)', icon: '👻' },
        };

        (gameState.power_ups || []).forEach((pu) => {
            const cx = pu.position.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = pu.position.y * CELL_SIZE + CELL_SIZE / 2;
            const colors = powerUpColors[pu.power_type];

            // Outer glow
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL_SIZE * 1.5);
            gradient.addColorStop(0, colors.glow);
            gradient.addColorStop(0.5, colors.glow.replace('0.6', '0.2'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(pu.position.x * CELL_SIZE - CELL_SIZE, pu.position.y * CELL_SIZE - CELL_SIZE, CELL_SIZE * 3, CELL_SIZE * 3);

            // Core shape (diamond)
            ctx.fillStyle = colors.main;
            ctx.beginPath();
            ctx.moveTo(cx, cy - CELL_SIZE * 0.4);
            ctx.lineTo(cx + CELL_SIZE * 0.4, cy);
            ctx.lineTo(cx, cy + CELL_SIZE * 0.4);
            ctx.lineTo(cx - CELL_SIZE * 0.4, cy);
            ctx.closePath();
            ctx.fill();

            // Border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Snakes
        Object.values(gameState.players).forEach((player) => {
            const isCurrentPlayer = player.id === playerId;
            const baseColor = player.snake.color || '#a855f7';

            player.snake.body.forEach((segment, index) => {
                const x = segment.x * CELL_SIZE;
                const y = segment.y * CELL_SIZE;
                const isHead = index === 0;

                // Dead snakes are faded
                const alpha = player.snake.alive ? 1 : 0.3;

                if (isHead) {
                    // Power-up color detection
                    let displayColor = baseColor;
                    if (player.active_power) {
                        switch (player.active_power.power_type) {
                            case 'SpeedBoost': displayColor = '#22d3ee'; break;
                            case 'Shield': displayColor = '#a855f7'; break;
                            case 'Ghost': displayColor = '#e879f9'; break;
                            case 'Grow': displayColor = '#4ade80'; break;
                        }
                    }

                    // Head with glow for current player or power-up
                    if ((isCurrentPlayer || player.active_power) && player.snake.alive) {
                        ctx.shadowColor = displayColor;
                        ctx.shadowBlur = player.active_power ? 20 : 10;
                    }
                    ctx.fillStyle = player.snake.alive ? displayColor : `${displayColor}4D`;
                    ctx.beginPath();
                    ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Eyes
                    if (player.snake.alive) {
                        ctx.fillStyle = '#0a0a0f';
                        const eyeSize = 3;
                        const eyeOffset = 4;
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.arc(x + CELL_SIZE - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    // Body segments with gradient fade
                    const fade = 1 - (index / player.snake.body.length) * 0.4;
                    ctx.globalAlpha = alpha * fade;
                    ctx.fillStyle = baseColor;
                    ctx.beginPath();
                    ctx.roundRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 3);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        });
    }, [gameState, playerId]);

    return (
        <canvas
            ref={canvasRef}
            width={gameState.grid_width * CELL_SIZE}
            height={gameState.grid_height * CELL_SIZE}
            className="rounded-xl border border-white/10 shadow-2xl"
        />
    );
}

// =============================================================================
// SCOREBOARD COMPONENT
// =============================================================================

function Scoreboard({ gameState, playerId }: { gameState: GameState; playerId: string }) {
    const players = Object.values(gameState.players).sort((a, b) => b.snake.score - a.snake.score);

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Scoreboard
            </h3>
            <div className="space-y-2">
                {players.map((player, idx) => (
                    <div
                        key={player.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${player.id === playerId ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/[0.02]'
                            }`}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: player.snake.color + '20', color: player.snake.color }}
                        >
                            {idx === 0 && gameState.phase === 'Playing' ? (
                                <Crown className="w-4 h-4" />
                            ) : (
                                idx + 1
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-medium truncate ${player.snake.alive ? 'text-white' : 'text-slate-500 line-through'}`}>
                                    {player.name}
                                </span>
                                {player.id === playerId && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">YOU</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!player.snake.alive && <Skull className="w-4 h-4 text-red-400" />}
                            <span className="font-mono font-bold text-white">{player.snake.score}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// LOBBY COMPONENT
// =============================================================================

function Lobby({
    gameState,
    playerId,
    onReady,
    onStart,
    playerName,
    setPlayerName,
    onJoin,
    hasJoined,
    roomCode,
}: {
    gameState: GameState;
    playerId: string;
    onReady: () => void;
    onStart: () => void;
    playerName: string;
    setPlayerName: (name: string) => void;
    onJoin: () => void;
    hasJoined: boolean;
    roomCode?: string;
}) {
    const players = Object.values(gameState.players);
    const allReady = players.length > 0 && players.every((p) => p.ready);
    const currentPlayer = players.find((p) => p.id === playerId);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Waiting for Players</h2>
                <p className="text-slate-400">Up to 4 players can join this battle</p>
                {roomCode && (
                    <div className="mt-4 bg-white/5 border border-white/10 rounded-lg px-4 py-2 inline-block">
                        <span className="text-slate-400 text-sm mr-2">ROOM CODE:</span>
                        <span className="text-xl font-mono font-bold text-cyan-400 tracking-widest">{roomCode}</span>
                    </div>
                )}
            </div>

            {!hasJoined ? (
                <div className="flex flex-col items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6 w-80">
                    <User className="w-12 h-12 text-violet-400" />
                    <input
                        type="text"
                        placeholder="Enter your name..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={15}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-center"
                    />
                    <button
                        onClick={onJoin}
                        disabled={!playerName.trim()}
                        className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Gamepad2 className="w-5 h-5" />
                        Join Game
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        {[0, 1, 2, 3].map((idx) => {
                            const player = players[idx];
                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border ${player
                                        ? 'bg-white/[0.02] border-white/10'
                                        : 'bg-white/[0.01] border-dashed border-white/5'
                                        }`}
                                >
                                    {player ? (
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: player.snake.color + '20' }}
                                            >
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: player.snake.color }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{player.name}</p>
                                                <p className={`text-xs ${player.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {player.ready ? '✓ Ready' : 'Not Ready'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-14 text-slate-600">
                                            <Users className="w-5 h-5 mr-2" />
                                            Waiting...
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-4">
                        {currentPlayer && !currentPlayer.ready && (
                            <button
                                onClick={onReady}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                            >
                                Ready Up
                            </button>
                        )}
                        {allReady && (
                            <button
                                onClick={onStart}
                                className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Start Game
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// =============================================================================
// COUNTDOWN OVERLAY
// =============================================================================

function CountdownOverlay({ countdown }: { countdown: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl"
        >
            <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-9xl font-bold text-white drop-shadow-2xl"
                style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.8)' }}
            >
                {countdown === 0 ? 'GO!' : countdown}
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// POWER-UP INFO PANEL
// =============================================================================

function PowerUpInfo() {
    const powerUps = [
        { icon: '⚡', name: 'Speed Boost', color: '#22d3ee', desc: '2x faster for 5 seconds' },
        { icon: '🛡️', name: 'Shield', color: '#a855f7', desc: 'Invincible for 3 seconds' },
        { icon: '📏', name: 'Grow', color: '#4ade80', desc: 'Instant +5 length' },
        { icon: '👻', name: 'Ghost', color: '#e879f9', desc: 'Pass through everything for 2s' },
    ];

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Power-ups
            </h3>
            {powerUps.map((pu) => (
                <div key={pu.name} className="flex items-center gap-3 group">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ background: `${pu.color}20`, border: `1px solid ${pu.color}40` }}
                    >
                        {pu.icon}
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-white">{pu.name}</div>
                        <div className="text-xs text-slate-400">{pu.desc}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// GAME OVER OVERLAY
// =============================================================================

function GameOverOverlay({ winner, onRestart, onPlayAgain }: { winner: string | null; onRestart: () => void; onPlayAgain: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl"
        >
            <div className="text-center space-y-6">
                <Crown className="w-16 h-16 text-amber-400 mx-auto" />
                <div>
                    <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
                    {winner ? (
                        <p className="text-xl text-violet-300">{winner} wins!</p>
                    ) : (
                        <p className="text-xl text-slate-400">No survivors...</p>
                    )}
                </div>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onPlayAgain}
                        className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Play Again
                    </button>
                    <button
                        onClick={onRestart}
                        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// =============================================================================
// ROOM MENU COMPONENT
// =============================================================================

function RoomMenu({
    onCreateRoom,
    onJoinRoom,
    onQuickMatch,
    onSoloGame,
    error
}: {
    onCreateRoom: (settings: RoomSettings) => void;
    onJoinRoom: (code: string) => void;
    onQuickMatch: () => void;
    onSoloGame: (difficulty: string, numBots: number) => void;
    error: string | null;
}) {
    const [mode, setMode] = useState<'Main' | 'Create' | 'Join' | 'Solo'>('Main');
    const [soloDifficulty, setSoloDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [numBots, setNumBots] = useState(2);
    const [roomCode, setRoomCode] = useState('');
    const [settings, setSettings] = useState<RoomSettings>({
        max_players: 4,
        speed: 'Normal',
        power_ups_enabled: true,
        rounds: 1,
        map_size: 'Medium'
    });

    // Create Room UI
    if (mode === 'Create') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0f0f12] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <Gamepad2 className="w-5 h-5 text-white/70" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Create Room</h2>
                    </div>
                </div>

                {/* Settings */}
                <div className="p-6 space-y-5">
                    {/* Max Players */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Players</label>
                        <div className="flex gap-2">
                            {[2, 3, 4].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setSettings({ ...settings, max_players: n })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${settings.max_players === n
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Speed */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Speed</label>
                        <div className="flex gap-2">
                            {['Slow', 'Normal', 'Fast'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSettings({ ...settings, speed: s as any })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${settings.speed === s
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Map Size */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Map Size</label>
                        <div className="flex gap-2">
                            {['Small', 'Medium', 'Large'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSettings({ ...settings, map_size: s as any })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${settings.map_size === s
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Power-ups Toggle */}
                    <div
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer border border-white/5 hover:border-white/10 transition-colors"
                        onClick={() => setSettings({ ...settings, power_ups_enabled: !settings.power_ups_enabled })}
                    >
                        <span className="text-sm text-slate-300">Power-ups</span>
                        <div className={`w-10 h-6 rounded-full relative transition-all ${settings.power_ups_enabled
                            ? 'bg-emerald-500'
                            : 'bg-slate-700'
                            }`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.power_ups_enabled ? 'left-5' : 'left-1'}`} />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                    <button
                        onClick={() => setMode('Main')}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all text-sm"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => onCreateRoom(settings)}
                        className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-black font-medium rounded-lg transition-all text-sm"
                    >
                        Create Room
                    </button>
                </div>
            </motion.div>
        );
    }

    // Join Room UI
    if (mode === 'Join') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0f0f12] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <Users className="w-5 h-5 text-white/70" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Join Room</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="ENTER CODE"
                        maxLength={6}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.25em] text-white font-mono placeholder:text-slate-600 focus:outline-none transition-colors"
                    />

                    {error && (
                        <div className="mt-4 text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                    <button
                        onClick={() => setMode('Main')}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all text-sm"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => onJoinRoom(roomCode)}
                        disabled={roomCode.length !== 6}
                        className="flex-1 py-2.5 bg-white hover:bg-slate-200 disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-all text-sm"
                    >
                        Join
                    </button>
                </div>
            </motion.div>
        );
    }

    // Solo Mode Setup
    if (mode === 'Solo') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0f0f12] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <Bot className="w-5 h-5 text-white/70" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Solo Mode</h2>
                    </div>
                </div>

                {/* Settings */}
                <div className="p-6 space-y-5">
                    {/* Difficulty */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">AI Difficulty</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => setSoloDifficulty(diff)}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${soloDifficulty === diff
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Number of Bots */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Number of Bots</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setNumBots(n)}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${numBots === n
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {n} Bot{n > 1 ? 's' : ''}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                    <button
                        onClick={() => setMode('Main')}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all text-sm"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => onSoloGame(soloDifficulty, numBots)}
                        className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-black font-medium rounded-lg transition-all text-sm"
                    >
                        Start Game
                    </button>
                </div>
            </motion.div>
        );
    }

    // Main Menu
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f12] rounded-2xl border border-white/10 w-full max-w-sm overflow-hidden"
        >
            {/* Header with Logo */}
            <div className="px-6 py-8 text-center border-b border-white/5">
                <h1 className="text-3xl font-black tracking-tight mb-1">
                    <span className="text-white">SNAKE</span>{' '}
                    <span className="text-violet-400">BATTLE</span>
                </h1>
                <p className="text-slate-500 text-xs tracking-wider uppercase">Multiplayer Arcade</p>
            </div>

            {/* Menu Options */}
            <div className="p-4 space-y-2">
                {/* Quick Match - Primary */}
                <button
                    onClick={onQuickMatch}
                    className="w-full group flex items-center justify-center gap-3 px-6 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl transition-all font-semibold text-white"
                >
                    <Play className="w-5 h-5 fill-current" />
                    Quick Match
                </button>

                {/* Create Room */}
                <button
                    onClick={() => setMode('Create')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                >
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Gamepad2 className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-white text-sm">Create Room</div>
                        <div className="text-xs text-slate-500">Host a private game</div>
                    </div>
                </button>

                {/* Join Room */}
                <button
                    onClick={() => setMode('Join')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                >
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Users className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-white text-sm">Join Room</div>
                        <div className="text-xs text-slate-500">Enter a room code</div>
                    </div>
                </button>

                {/* Solo Mode */}
                <button
                    onClick={() => setMode('Solo')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                >
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Bot className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-white text-sm">Solo Mode</div>
                        <div className="text-xs text-slate-500">Play against AI bots</div>
                    </div>
                </button>
            </div>

            {error && (
                <div className="mx-4 mb-4 text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                    {error}
                </div>
            )}
        </motion.div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function SnakeBattlePage() {
    const [connected, setConnected] = useState(false);
    const [playerId, setPlayerId] = useState<string>('');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [gameMode, setGameMode] = useState<GameMode>('Menu');
    const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

    // Supabase Auth
    useEffect(() => {
        const supabase = createClient();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.user_metadata?.full_name) {
                setPlayerName(session.user.user_metadata.full_name.split(' ')[0]);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.user_metadata?.full_name) {
                setPlayerName(session.user.user_metadata.full_name.split(' ')[0]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const wsRef = useRef<WebSocket | null>(null);

    const handleCreateRoom = async (settings: RoomSettings) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7860'}/api/v1/games/snake/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings, is_public: false })
            });
            const data = await res.json();
            if (data.code) {
                setActiveRoomCode(data.code);
                setGameMode('Lobby');
            } else {
                setError('Failed to create room');
            }
        } catch (e) {
            setError('Connection error');
        }
    };

    const handleJoinRoom = (code: string) => {
        setActiveRoomCode(code);
        setGameMode('Lobby');
    };

    const handleQuickMatch = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7860'}/api/v1/games/snake/quick-match`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.code) {
                setActiveRoomCode(data.code);
                setGameMode('Lobby');
            } else {
                setError('No matches found');
            }
        } catch (e) {
            setError('Connection error');
        }
    };

    const handleSoloGame = async (difficulty: string, numBots: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7860'}/api/v1/games/snake/solo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ difficulty, num_bots: numBots })
            });
            const data = await res.json();
            if (data.code) {
                setActiveRoomCode(data.code);
                setGameMode('Lobby');
            } else {
                setError('Failed to create solo game');
            }
        } catch (e) {
            setError('Connection error');
        }
    };

    // Connect to WebSocket
    useEffect(() => {
        if (!activeRoomCode) return;

        const url = `${WS_URL}/${activeRoomCode}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            setError(null);
        };

        ws.onclose = () => {
            setConnected(false);
            setHasJoined(false);
        };

        ws.onerror = () => {
            setError('Connection failed. Make sure the backend is running.');
        };

        ws.onmessage = (event) => {
            try {
                const msg: ServerMessage = JSON.parse(event.data);

                switch (msg.type) {
                    case 'Welcome':
                        setPlayerId(msg.payload.player_id);
                        break;
                    case 'GameState':
                        setGameState(msg.payload);
                        break;
                    case 'Error':
                        setError(msg.payload.message);
                        break;
                    case 'GameOver':
                        // Handled via GameState
                        break;
                }
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        };

        return () => {
            ws.close();
        };
    }, [activeRoomCode]);

    // Keyboard controls with client-side prediction
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!wsRef.current || gameState?.phase !== 'Playing' || !playerId) return;

            let direction: Direction | null = null;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    direction = 'Up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    direction = 'Down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    direction = 'Left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    direction = 'Right';
                    break;
            }

            if (direction) {
                e.preventDefault();

                // CLIENT-SIDE PREDICTION: Update local state immediately for instant feedback
                setGameState(prevState => {
                    if (!prevState || !playerId) return prevState;

                    const player = prevState.players[playerId];
                    if (!player) return prevState;

                    // Check if direction change is valid (can't reverse)
                    const currentDir = player.snake.direction;
                    const isOpposite =
                        (currentDir === 'Up' && direction === 'Down') ||
                        (currentDir === 'Down' && direction === 'Up') ||
                        (currentDir === 'Left' && direction === 'Right') ||
                        (currentDir === 'Right' && direction === 'Left');

                    if (isOpposite) return prevState; // Invalid move, don't update

                    // Create new state with updated direction
                    return {
                        ...prevState,
                        players: {
                            ...prevState.players,
                            [playerId]: {
                                ...player,
                                snake: {
                                    ...player.snake,
                                    next_direction: direction // Update next direction for visual feedback
                                }
                            }
                        }
                    };
                });

                // Send to server (server state will be authoritative and overwrite on next tick)
                wsRef.current.send(JSON.stringify({ type: 'Direction', payload: { direction } }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState?.phase, playerId]);

    const sendMessage = useCallback((msg: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    const handleJoin = () => {
        if (playerName.trim()) {
            sendMessage({
                type: 'Join',
                payload: {
                    name: playerName.trim(),
                    user_id: user?.id,
                    access_token: session?.access_token
                }
            });
            setHasJoined(true);
        }
    };

    const handleReady = () => {
        sendMessage({ type: 'Ready' });
    };

    const handleStart = () => {
        sendMessage({ type: 'StartGame' });
    };

    const handleRestart = () => {
        sendMessage({ type: 'Restart' });
        setHasJoined(false);
    };

    const handlePlayAgain = () => {
        sendMessage({ type: 'PlayAgain' });
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-6 pt-4 gap-6 relative">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-lime-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between z-10"
            >
                <div className="flex items-center gap-4">
                    <Link
                        href="/games"
                        className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Snake Battle</h1>
                        <p className="text-slate-400 text-sm">Multiplayer • Up to 4 Players</p>
                    </div>
                </div>
                {activeRoomCode && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                        }`}>
                        {connected ? (
                            <>
                                <Wifi className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-400">Connected</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-red-400" />
                                <span className="text-xs font-medium text-red-400">Disconnected</span>
                            </>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm z-10"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Area */}
            <div className="flex-1 flex gap-6 z-10 overflow-hidden">
                {/* Main Game */}
                <div className="flex-1 relative bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
                    {!activeRoomCode ? (
                        <RoomMenu
                            onCreateRoom={handleCreateRoom}
                            onJoinRoom={handleJoinRoom}
                            onQuickMatch={handleQuickMatch}
                            onSoloGame={handleSoloGame}
                            error={error}
                        />
                    ) : !connected ? (
                        <div className="text-center text-slate-400">
                            <WifiOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Connecting to server...</p>
                        </div>
                    ) : !gameState ? (
                        <div className="text-center text-slate-400">
                            <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                            <p>Loading game...</p>
                        </div>
                    ) : gameState.phase === 'Lobby' ? (
                        <Lobby
                            gameState={gameState}
                            playerId={playerId}
                            onReady={handleReady}
                            onStart={handleStart}
                            playerName={playerName}
                            setPlayerName={setPlayerName}
                            onJoin={handleJoin}
                            hasJoined={hasJoined}
                            roomCode={activeRoomCode}
                        />
                    ) : (
                        <>
                            <GameCanvas gameState={gameState} playerId={playerId} />
                            {gameState.phase === 'Countdown' && gameState.countdown > 0 && (
                                <CountdownOverlay countdown={gameState.countdown} />
                            )}
                            {gameState.phase === 'GameOver' && (
                                <GameOverOverlay winner={gameState.winner} onRestart={handleRestart} onPlayAgain={handlePlayAgain} />
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar */}
                {gameState && gameState.phase !== 'Lobby' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-72 flex-shrink-0 space-y-4"
                    >
                        <Scoreboard gameState={gameState} playerId={playerId} />

                        {/* Room Info */}
                        {activeRoomCode && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Room Code</h3>
                                <div className="text-xl font-mono font-bold text-cyan-400 tracking-widest">{activeRoomCode}</div>
                            </div>
                        )}

                        {/* Controls hint */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Controls</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div />
                                <div className="bg-white/5 rounded-lg py-2 text-white font-mono text-sm">W ↑</div>
                                <div />
                                <div className="bg-white/5 rounded-lg py-2 text-white font-mono text-sm">A ←</div>
                                <div className="bg-white/5 rounded-lg py-2 text-white font-mono text-sm">S ↓</div>
                                <div className="bg-white/5 rounded-lg py-2 text-white font-mono text-sm">D →</div>
                            </div>
                        </div>

                        {/* Power-ups Info */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                            <PowerUpInfo />
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
