'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Game assets
const CARDS = [
    { id: 1, emoji: '🪐', name: 'Saturn' },
    { id: 2, emoji: '🚀', name: 'Rocket' },
    { id: 3, emoji: '🛸', name: 'UFO' },
    { id: 4, emoji: '⭐', name: 'Star' },
    { id: 5, emoji: '🌙', name: 'Moon' },
    { id: 6, emoji: '☄️', name: 'Comet' },
    { id: 7, emoji: '👨‍🚀', name: 'Astronaut' },
    { id: 8, emoji: '👽', name: 'Alien' },
];

interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
    uniqueId: number;
}

import { createClient } from '@/utils/supabase/client';

// ... (existing imports)

export default function GalaxyMatchPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matches, setMatches] = useState(0);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const supabase = createClient();

    // ... (existing useEffect)

    const saveScore = async (finalScore: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('game_scores').insert({
                user_id: user.id,
                game_id: 'galaxy-match',
                score: finalScore
            });
            console.log('Score saved!');
        } catch (error) {
            console.error('Error saving score:', error);
        }
    };

    const startNewGame = () => {
        // Create pairs
        const gameCards = [...CARDS, ...CARDS]
            .sort(() => Math.random() - 0.5)
            .map((card, index) => ({
                ...card,
                uniqueId: index,
                isFlipped: false,
                isMatched: false,
            }));

        setCards(gameCards);
        setFlippedCards([]);
        setMatches(0);
        setMoves(0);
        setScore(0);
        setGameOver(false);
    };

    const handleCardClick = (index: number) => {
        // Prevent clicking if already 2 flipped, or card is already flipped/matched
        if (
            flippedCards.length === 2 ||
            cards[index].isFlipped ||
            cards[index].isMatched
        ) {
            return;
        }

        // Flip card
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, index];
        setFlippedCards(newFlipped);

        // Check for match
        if (newFlipped.length === 2) {
            setMoves((prev) => prev + 1);
            const [firstIndex, secondIndex] = newFlipped;

            if (cards[firstIndex].id === cards[secondIndex].id) {
                // Match found
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((card, i) =>
                            i === firstIndex || i === secondIndex
                                ? { ...card, isMatched: true }
                                : card
                        )
                    );
                    setFlippedCards([]);
                    setMatches((prev) => {
                        const newMatches = prev + 1;
                        if (newMatches === CARDS.length) {
                            // Game Over - Save Score
                            const finalMoves = moves + 1; // Include current move

                            // Calculate score based on moves (fewer moves = higher score)
                            // Base 1000 - (moves * 10) + matches bonus
                            const finalScore = Math.max(0, 1000 - (finalMoves * 20)) + score + 100;
                            setScore(finalScore);

                            saveScore(finalScore);
                            setGameOver(true);
                        }
                        return newMatches;
                    });
                    setScore((prev) => prev + 100);
                }, 500);
            } else {
                // No match
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((card, i) =>
                            i === firstIndex || i === secondIndex
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                    setFlippedCards([]);
                    setScore((prev) => Math.max(0, prev - 10)); // Penalty
                }, 1000);
            }
        }
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Game Header */}
            <div className="z-10 text-center mb-8">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2 tracking-tight">
                    GALAXY MATCH
                </h1>
                <div className="flex gap-8 text-sm font-medium text-slate-400 justify-center">
                    <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        Moves: <span className="text-white ml-2">{moves}</span>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        Score: <span className="text-amber-400 ml-2">{score}</span>
                    </div>
                </div>
            </div>

            {/* Game Grid */}
            <div className="z-10 grid grid-cols-4 gap-4 max-w-2xl w-full perspective-1000">
                <AnimatePresence>
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.uniqueId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: index * 0.05 }}
                            className="aspect-square relative cursor-pointer group perspective-1000"
                            onClick={() => handleCardClick(index)}
                        >
                            <div
                                className={`w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-xl border border-white/10 ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                                    }`}
                            >
                                {/* Card Back */}
                                <div className="absolute inset-0 backface-hidden bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    <span className="text-2xl opacity-50">✨</span>
                                </div>

                                {/* Card Front */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-violet-500/30">
                                    <span className="text-4xl drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                        {card.emoji}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Game Over Modal */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0f0f13] border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl shadow-violet-500/20"
                        >
                            <h2 className="text-3xl font-bold text-white mb-2">Victory! 🏆</h2>
                            <p className="text-slate-400 mb-6">You explored the galaxy in {moves} moves.</p>

                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500 mb-8">
                                {score}
                            </div>

                            <button
                                onClick={startNewGame}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-600/20"
                            >
                                Play Again
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .transform-style-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </main>
    );
}
