'use client';

import { useState, useRef, useEffect } from 'react';
import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    placeholder: string;
    disabled?: boolean;
    users: User[];
    className?: string;
}

export function MentionInput({
    value,
    onChange,
    onKeyDown,
    placeholder,
    disabled,
    users,
    className
}: MentionInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Detect @ mentions
        const cursorPos = inputRef.current?.selectionStart || 0;
        const textBeforeCursor = value.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(' ')) {
                const query = textAfterAt.toLowerCase();
                const filtered = users.filter(u =>
                    u.username?.toLowerCase().includes(query) ||
                    u.email?.toLowerCase().includes(query)
                ).slice(0, 5);

                if (filtered.length > 0) {
                    setSuggestions(filtered);
                    setShowSuggestions(true);
                    setMentionStart(lastAtIndex);
                    setSelectedIndex(0);
                    return;
                }
            }
        }

        setShowSuggestions(false);
        setSuggestions([]);
    }, [value, users]);

    const insertMention = (user: User) => {
        if (mentionStart === -1) return;

        const before = value.slice(0, mentionStart);
        const cursorPos = inputRef.current?.selectionStart || value.length;
        const after = value.slice(cursorPos);

        const newValue = `${before}@${user.username} ${after}`;
        onChange(newValue);
        setShowSuggestions(false);

        // Focus back on input
        setTimeout(() => {
            inputRef.current?.focus();
            const newCursorPos = before.length + (user.username?.length || 0) + 2;
            inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                if (suggestions[selectedIndex]) {
                    e.preventDefault();
                    insertMention(suggestions[selectedIndex]);
                    return;
                }
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                return;
            }
        }

        onKeyDown(e);
    };

    return (
        <div className="relative flex-1">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 
                                bg-[#1a1a1a] border border-white/10 rounded-xl 
                                shadow-xl overflow-hidden z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Members matching
                        </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {suggestions.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => insertMention(user)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                                    ${index === selectedIndex
                                        ? 'bg-violet-500/20 text-white'
                                        : 'hover:bg-white/5 text-slate-300'
                                    }`}
                            >
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username || ''}
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 
                                                    flex items-center justify-center text-xs font-bold text-white">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user.username || 'Unknown'}
                                    </p>
                                    {user.role && (
                                        <p className="text-[10px] text-slate-500">
                                            {user.role}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to render message content with highlighted mentions
export function renderMessageWithMentions(content: string, onMentionClick?: (username: string) => void) {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
        // Every odd index is a mention
        if (index % 2 === 1) {
            return (
                <span
                    key={index}
                    onClick={() => onMentionClick?.(part)}
                    className="text-violet-400 font-medium cursor-pointer hover:underline"
                >
                    @{part}
                </span>
            );
        }
        return part;
    });
}
