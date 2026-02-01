'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Gamepad2, Sparkles, Lock, Play, Star, Trophy, Zap,
    Rocket, Link, Terminal, Keyboard, Activity, Palette
} from 'lucide-react';

// Game data
const GAMES = [
    // Featured Game extracted separately in UI, but kept here for data consistency if needed
    {
        id: 'galaxy-match',
        name: 'Galaxy Match',
        description: 'Embark on a cosmic memory journey. Match planets, stars, and alien lifeforms to score points and unlock the mysteries of the universe.',
        difficulty: 'Easy',
        icon: Rocket,
        isPlayable: true,
        gradient: 'from-violet-500/20 to-fuchsia-500/20',
        href: '/games/galaxy-match'
    },
    {
        id: 'word-chain',
        name: 'Word Chain',
        description: 'A linguistic challenge where every word must begin with the last letter of the previous one.',
        difficulty: 'Easy',
        icon: Link,
        isPlayable: false,
        gradient: 'from-emerald-500/20 to-teal-500/20',
        href: null
    },
    {
        id: 'code-trivia',
        name: 'Code Trivia',
        description: 'Test your knowledge of algorithms, languages, and history in this developer-centric quiz.',
        difficulty: 'Easy',
        icon: Terminal,
        isPlayable: false,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        href: null
    },
    {
        id: 'typing-race',
        name: 'Typing Race',
        description: 'How fast can you code? Race against the clock and improve your WPM.',
        difficulty: 'Medium',
        icon: Keyboard,
        isPlayable: false,
        gradient: 'from-amber-500/20 to-orange-500/20',
        href: null
    },
    {
        id: 'snake-battle',
        name: 'Snake Battle',
        description: 'The classic game reimagined with multiplayer mechanics and power-ups.',
        difficulty: 'Medium',
        icon: Activity,
        isPlayable: false,
        gradient: 'from-lime-500/20 to-green-500/20',
        href: null
    },
    {
        id: 'quick-draw',
        name: 'Quick Draw',
        description: 'Express your creativity and guess drawings from your friends in real-time.',
        difficulty: 'Hard',
        icon: Palette,
        isPlayable: false,
        gradient: 'from-pink-500/20 to-rose-500/20',
        href: null
    }
];

export default function GamesPage() {
    const router = useRouter();
    const [hoveredGame, setHoveredGame] = useState<string | null>(null);

    const featuredGame = GAMES.find(g => g.id === 'galaxy-match');
    const otherGames = GAMES.filter(g => g.id !== 'galaxy-match');

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-6 pt-4 gap-6 relative">
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            < motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between z-10"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Arcade Center
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-lg">
                        Take a break. Play together. Have fun — multiplayer mini-games made for everyone.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-300">Global Leaderboard coming soon</span>
                </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto z-10 pr-2 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-10 pb-10">

                    {/* Featured Game Section */}
                    {featuredGame && (
                        <motion.section
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                Featured Game
                            </h2>
                            <div
                                onClick={() => router.push(featuredGame.href!)}
                                className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f12] cursor-pointer"
                            >
                                {/* Featured Card Background Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-[#0f0f12] to-black opacity-80" />
                                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                                    {/* Game Icon / Art */}
                                    <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                                        <div className="absolute inset-0 bg-violet-500/20 blur-[60px] rounded-full animate-pulse" />
                                        <div className="relative w-full h-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                            <featuredGame.icon className="w-16 h-16 md:w-24 md:h-24 text-white/90 drop-shadow-glow" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                            <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold uppercase border border-violet-500/20">
                                                New Arrival
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                                                {featuredGame.difficulty}
                                            </span>
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-violet-300 transition-colors">
                                            {featuredGame.name}
                                        </h3>
                                        <p className="text-slate-400 text-base leading-relaxed max-w-2xl mb-8">
                                            {featuredGame.description}
                                        </p>
                                        <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-violet-200 transition-all transform group-hover:translate-x-1 flex items-center gap-2 mx-auto md:mx-0 shadow-lg shadow-white/5">
                                            <Play className="w-5 h-5 fill-current" />
                                            Play Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* All Games Grid */}
                    <section>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-slate-400" />
                            More Games
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {otherGames.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    onMouseEnter={() => setHoveredGame(game.id)}
                                    onMouseLeave={() => setHoveredGame(null)}
                                    onClick={() => game.isPlayable && game.href && router.push(game.href)}
                                    className={`relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-300 group ${game.isPlayable
                                        ? 'cursor-pointer hover:bg-white/[0.04] hover:border-violet-500/30 hover:-translate-y-1 shadow-xl hover:shadow-violet-500/10'
                                        : 'opacity-60 cursor-not-allowed grayscale-[0.5] hover:grayscale-0 transition-all'
                                        }`}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <game.icon className="w-7 h-7 text-white/80" />
                                            </div>
                                            {game.isPlayable ? (
                                                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-110 transition-transform">
                                                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500 uppercase">
                                                    Coming Soon
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                                            {game.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                                            {game.description}
                                        </p>

                                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${game.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                game.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {game.difficulty}
                                            </span>
                                            {game.isPlayable && (
                                                <span className="text-[10px] text-violet-400 font-medium ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-violet-500/10 px-2 py-1 rounded-full">
                                                    <Sparkles className="w-3 h-3" />
                                                    Ready to Play
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
