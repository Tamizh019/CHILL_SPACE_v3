'use client';

import { useState } from 'react';

interface Reaction {
    emoji: string;
    count: number;
    userIds: string[];
    hasReacted: boolean;
}

interface MessageReactionsProps {
    reactions: Reaction[];
    onAddReaction: (emoji: string) => void;
    onRemoveReaction: (emoji: string) => void;
}

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥'];

export function MessageReactions({ reactions, onAddReaction, onRemoveReaction }: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false);

    const handleReactionClick = (emoji: string, hasReacted: boolean) => {
        if (hasReacted) {
            onRemoveReaction(emoji);
        } else {
            onAddReaction(emoji);
        }
    };

    return (
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Existing reactions */}
            {reactions.map((reaction) => (
                <button
                    key={reaction.emoji}
                    onClick={() => handleReactionClick(reaction.emoji, reaction.hasReacted)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all
                        ${reaction.hasReacted
                            ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                            : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    <span>{reaction.emoji}</span>
                    <span className="font-medium">{reaction.count}</span>
                </button>
            ))}

            {/* Add reaction button */}
            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-6 h-6 rounded-full bg-white/5 border border-white/10 
                               flex items-center justify-center text-slate-500 
                               hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <span className="material-icons-round text-sm">add_reaction</span>
                </button>

                {/* Emoji picker */}
                {showPicker && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 
                                    bg-[#1a1a1a] border border-white/10 rounded-xl 
                                    flex gap-1 shadow-xl z-50 animate-scale-in">
                        {AVAILABLE_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    onAddReaction(emoji);
                                    setShowPicker(false);
                                }}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 
                                           flex items-center justify-center text-lg
                                           transition-transform hover:scale-110"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact picker that shows on message hover
export function ReactionPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
    return (
        <div className="flex gap-0.5 p-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
            {AVAILABLE_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="w-7 h-7 rounded hover:bg-white/10 
                               flex items-center justify-center text-base
                               transition-transform hover:scale-110"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
