'use client';

import { useState, useEffect, Fragment } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type File = Database['public']['Tables']['files']['Row'];

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResults {
    channels: Channel[];
    users: User[];
    files: (File & { uploader?: { username: string | null; avatar_url: string | null } })[];
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ channels: [], users: [], files: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const supabase = createClient();

    // Calculate total results
    const totalResults = results.channels.length + results.users.length + results.files.length;

    // Perform search
    useEffect(() => {
        if (!searchQuery.trim() || !isOpen) {
            setResults({ channels: [], users: [], files: [] });
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            try {
                const query = searchQuery.toLowerCase().trim();

                // Search channels
                const { data: channels } = await supabase
                    .from('channels')
                    .select('*')
                    .ilike('name', `%${query}%`)
                    .limit(5);

                // Search users
                const { data: users } = await supabase
                    .from('users')
                    .select('*')
                    .ilike('username', `%${query}%`)
                    .limit(5);

                // Search files
                const { data: files } = await supabase
                    .from('files')
                    .select(`
                        *,
                        uploader:users!uploader_id(username, avatar_url)
                    `)
                    .ilike('display_name', `%${query}%`)
                    .limit(5);

                setResults({
                    channels: channels || [],
                    users: users || [],
                    files: files || []
                });
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(performSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, totalResults - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectResult();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, totalResults]);

    // Handle result selection
    const handleSelectResult = () => {
        let index = 0;

        // Check channels
        if (selectedIndex < results.channels.length) {
            const channel = results.channels[selectedIndex];
            router.push(`/chat?channel=${channel.id}`);
            onClose();
            return;
        }
        index += results.channels.length;

        // Check users
        if (selectedIndex < index + results.users.length) {
            const user = results.users[selectedIndex - index];
            router.push(`/chat?dm=${user.id}`);
            onClose();
            return;
        }
        index += results.users.length;

        // Check files
        if (selectedIndex < index + results.files.length) {
            const file = results.files[selectedIndex - index];
            router.push(`/chat?tab=files&channel=${file.channel_id}`);
            onClose();
            return;
        }
    };

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 p-4 border-b border-white/5">
                            <span className="material-icons-round text-slate-500">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search channels, users, files..."
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 text-sm"
                            />
                            <kbd className="px-2 py-1 text-[10px] text-slate-500 border border-white/10 rounded bg-white/5">
                                ESC
                            </kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {isLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {!isLoading && !searchQuery && (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                    <span className="material-icons-round text-4xl text-slate-600 mb-2">search</span>
                                    <p className="text-sm text-slate-500">Start typing to search</p>
                                    <p className="text-xs text-slate-600 mt-1">Channels • Users • Files</p>
                                </div>
                            )}

                            {!isLoading && searchQuery && totalResults === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                    <span className="material-icons-round text-4xl text-slate-600 mb-2">search_off</span>
                                    <p className="text-sm text-slate-500">No results found</p>
                                    <p className="text-xs text-slate-600 mt-1">Try a different search term</p>
                                </div>
                            )}

                            {!isLoading && totalResults > 0 && (
                                <div className="p-2">
                                    {/* Channels */}
                                    {results.channels.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                Channels
                                            </h3>
                                            {results.channels.map((channel, idx) => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => {
                                                        router.push(`/chat?channel=${channel.id}`);
                                                        onClose();
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${selectedIndex === idx
                                                            ? 'bg-violet-500/10 border border-violet-500/20'
                                                            : 'hover:bg-white/5'
                                                        }`}
                                                >
                                                    <span className="material-icons-round text-slate-400 text-xl">tag</span>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-sm font-medium text-white">{channel.name}</p>
                                                        {channel.description && (
                                                            <p className="text-xs text-slate-500 truncate">{channel.description}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Users */}
                                    {results.users.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                Users
                                            </h3>
                                            {results.users.map((user, idx) => {
                                                const globalIdx = results.channels.length + idx;
                                                return (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => {
                                                            router.push(`/chat?dm=${user.id}`);
                                                            onClose();
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${selectedIndex === globalIdx
                                                                ? 'bg-violet-500/10 border border-violet-500/20'
                                                                : 'hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {user.avatar_url ? (
                                                            <img
                                                                src={user.avatar_url}
                                                                alt={user.username || 'User'}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                                {user.username?.[0]?.toUpperCase() || 'U'}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                                                            {user.role && (
                                                                <p className="text-xs text-slate-500">{user.role}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Files */}
                                    {results.files.length > 0 && (
                                        <div>
                                            <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                Files
                                            </h3>
                                            {results.files.map((file, idx) => {
                                                const globalIdx = results.channels.length + results.users.length + idx;
                                                const fileIcon = file.file_type?.startsWith('image/') ? 'image'
                                                    : file.file_type?.startsWith('video/') ? 'videocam'
                                                        : file.file_type?.includes('pdf') ? 'picture_as_pdf'
                                                            : 'insert_drive_file';

                                                return (
                                                    <button
                                                        key={file.id}
                                                        onClick={() => {
                                                            router.push(`/chat?tab=files&channel=${file.channel_id}`);
                                                            onClose();
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${selectedIndex === globalIdx
                                                                ? 'bg-violet-500/10 border border-violet-500/20'
                                                                : 'hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <span className="material-icons-round text-slate-400 text-xl">{fileIcon}</span>
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium text-white truncate">{file.display_name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                by {(file.uploader as any)?.username || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/20 text-[10px] text-slate-600">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 border border-white/10 rounded bg-white/5">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 border border-white/10 rounded bg-white/5">↓</kbd>
                                    navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 border border-white/10 rounded bg-white/5">↵</kbd>
                                    select
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 border border-white/10 rounded bg-white/5">ESC</kbd>
                                close
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
