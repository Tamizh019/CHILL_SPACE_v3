'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Gamepad2, Sparkles, Lock, Play, Star, Trophy, Zap,
    Rocket, Link, Terminal, Keyboard, Activity, Palette,
    Clock, Flame, ArrowRight
} from 'lucide-react';

// Game data with isNew flag for new arrivals
const GAMES = [
    {
        id: 'snake-battle',
        name: 'Snake Battle',
        description: 'The classic game reimagined with multiplayer mechanics, power-ups, and solo mode with AI bots.',
        difficulty: 'Medium',
        icon: Activity,
        isPlayable: true,
        isNew: true,
        gradient: 'from-violet-500/20 to-fuchsia-500/20',
        accentColor: 'violet',
        href: '/games/snake-battle'
    },
    {
        id: 'galaxy-match',
        name: 'Galaxy Match',
        description: 'Embark on a cosmic memory journey. Match planets, stars, and alien lifeforms to score points.',
        difficulty: 'Easy',
        icon: Rocket,
        isPlayable: true,
        isNew: false,
        gradient: 'from-violet-500/20 to-fuchsia-500/20',
        accentColor: 'violet',
        href: '/games/galaxy-match'
    },
    {
        id: 'word-chain',
        name: 'Word Chain',
        description: 'A linguistic challenge where every word must begin with the last letter of the previous one.',
        difficulty: 'Easy',
        icon: Link,
        isPlayable: false,
        isNew: false,
        gradient: 'from-emerald-500/20 to-teal-500/20',
        accentColor: 'emerald',
        href: null
    },
    {
        id: 'code-trivia',
        name: 'Code Trivia',
        description: 'Test your knowledge of algorithms, languages, and history in this developer-centric quiz.',
        difficulty: 'Easy',
        icon: Terminal,
        isPlayable: false,
        isNew: false,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        accentColor: 'blue',
        href: null
    },
    {
        id: 'typing-race',
        name: 'Typing Race',
        description: 'How fast can you code? Race against the clock and improve your WPM.',
        difficulty: 'Medium',
        icon: Keyboard,
        isPlayable: false,
        isNew: false,
        gradient: 'from-amber-500/20 to-orange-500/20',
        accentColor: 'amber',
        href: null
    },
    {
        id: 'quick-draw',
        name: 'Quick Draw',
        description: 'Express your creativity and guess drawings from your friends in real-time.',
        difficulty: 'Hard',
        icon: Palette,
        isPlayable: false,
        isNew: false,
        gradient: 'from-pink-500/20 to-rose-500/20',
        accentColor: 'pink',
        href: null
    }
];

// Helper to get/set recently played games from localStorage
const getRecentlyPlayed = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('recentlyPlayedGames');
    return stored ? JSON.parse(stored) : [];
};

const addRecentlyPlayed = (gameId: string) => {
    const recent = getRecentlyPlayed();
    const updated = [gameId, ...recent.filter(id => id !== gameId)].slice(0, 5);
    localStorage.setItem('recentlyPlayedGames', JSON.stringify(updated));
};

// Game Card Component
function GameCard({
    game,
    index,
    onPlay,
    variant = 'default'
}: {
    game: typeof GAMES[0];
    index: number;
    onPlay: (game: typeof GAMES[0]) => void;
    variant?: 'default' | 'compact';
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            onClick={() => game.isPlayable && onPlay(game)}
            className={`relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-300 group ${game.isPlayable
                ? 'cursor-pointer hover:bg-white/[0.04] hover:border-violet-500/30 hover:-translate-y-1 shadow-xl hover:shadow-violet-500/10'
                : 'opacity-60 cursor-not-allowed'
                } ${variant === 'compact' ? 'p-4' : 'p-6'}`}
        >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`${variant === 'compact' ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <game.icon className={`${variant === 'compact' ? 'w-5 h-5' : 'w-7 h-7'} text-white/80`} />
                    </div>
                    <div className="flex items-center gap-2">
                        {game.isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/20 flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                New
                            </span>
                        )}
                        {game.isPlayable ? (
                            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-110 transition-transform">
                                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                            </div>
                        ) : (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-slate-500 uppercase">
                                Soon
                            </span>
                        )}
                    </div>
                </div>

                <h3 className={`${variant === 'compact' ? 'text-base' : 'text-lg'} font-bold text-white mb-1.5 group-hover:text-violet-300 transition-colors`}>
                    {game.name}
                </h3>
                <p className={`text-slate-500 ${variant === 'compact' ? 'text-xs' : 'text-sm'} leading-relaxed line-clamp-2`}>
                    {game.description}
                </p>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${game.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        game.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {game.difficulty}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function GamesPage() {
    const router = useRouter();
    const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>([]);

    useEffect(() => {
        setRecentlyPlayedIds(getRecentlyPlayed());
    }, []);

    const handlePlayGame = (game: typeof GAMES[0]) => {
        if (game.isPlayable && game.href) {
            addRecentlyPlayed(game.id);
            router.push(game.href);
        }
    };

    // Get games for each section
    const recentlyPlayedGames = recentlyPlayedIds
        .map(id => GAMES.find(g => g.id === id))
        .filter((g): g is typeof GAMES[0] => g !== undefined && g.isPlayable);

    const playableGames = GAMES
        .filter(g => g.isPlayable)
        .sort((a, b) => {
            // New games first
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return 0;
        });

    const comingSoonGames = GAMES.filter(g => !g.isPlayable);

    // Featured game is the newest playable game
    const featuredGame = GAMES.find(g => g.isNew && g.isPlayable) || playableGames[0];

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-6 pt-4 gap-6 relative">
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between z-10"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Arcade Center</h1>
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
                <div className="max-w-6xl mx-auto space-y-8 pb-10">

                    {/* Recently Played Section */}
                    {recentlyPlayedGames.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                Continue Playing
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentlyPlayedGames.slice(0, 3).map((game, index) => (
                                    <GameCard
                                        key={game.id}
                                        game={game}
                                        index={index}
                                        onPlay={handlePlayGame}
                                        variant="compact"
                                    />
                                ))}
                            </div>
                        </motion.section>
                    )}

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
                                onClick={() => handlePlayGame(featuredGame)}
                                className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f12] cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-[#0f0f12] to-black opacity-80" />
                                <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative w-28 h-28 md:w-40 md:h-40 flex-shrink-0">
                                        <div className="absolute inset-0 bg-violet-500/20 blur-[50px] rounded-full animate-pulse" />
                                        <div className="relative w-full h-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                            <featuredGame.icon className="w-14 h-14 md:w-20 md:h-20 text-white/90" />
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                            {featuredGame.isNew && (
                                                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-xs font-bold uppercase border border-amber-500/20 flex items-center gap-1">
                                                    <Flame className="w-3 h-3" />
                                                    New Arrival
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${featuredGame.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                featuredGame.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {featuredGame.difficulty}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">
                                            {featuredGame.name}
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-6">
                                            {featuredGame.description}
                                        </p>
                                        <button className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-violet-200 transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-lg">
                                            <Play className="w-4 h-4 fill-current" />
                                            Play Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* All Playable Games */}
                    <section>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-violet-400" />
                            Play Now
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {playableGames.filter(g => g.id !== featuredGame?.id).map((game, index) => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    index={index}
                                    onPlay={handlePlayGame}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Coming Soon Section */}
                    <section>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-slate-400" />
                            Coming Soon
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {comingSoonGames.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative p-4 rounded-xl border border-white/5 bg-white/[0.02] opacity-60"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                            <game.icon className="w-5 h-5 text-white/60" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white/80">{game.name}</h3>
                                            <span className={`text-[10px] font-bold uppercase ${game.difficulty === 'Easy' ? 'text-emerald-400' :
                                                game.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                {game.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-xs line-clamp-2">{game.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
