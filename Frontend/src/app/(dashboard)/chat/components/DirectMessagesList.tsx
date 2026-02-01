'use client';

import { Database } from '@/types/supabase';
type User = Database['public']['Tables']['users']['Row'];

interface DirectMessagesListProps {
    users: User[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    unreadDmCounts?: Record<string, number>;
}

export function DirectMessagesList({ users, selectedId, onSelect, unreadDmCounts }: DirectMessagesListProps) {
    // For now, simple list. In future, sort by last message time or online status.

    return (
        <>
            <h3 className="px-3 text-[10px] font-heading font-bold uppercase tracking-widest text-slate-500 mt-4 mb-2">All Users</h3>
            {users.map(user => {
                const isActive = selectedId === user.id;
                // Placeholder gradient for avatar if none
                const gradient = 'from-orange-500 to-pink-500';

                return (
                    <div
                        key={user.id}
                        onClick={() => onSelect(user.id)}
                        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive
                            ? 'bg-violet-500/10 border border-violet-500/20'
                            : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                            }`}
                    >
                        <div className="relative">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.username || 'User'}
                                    className={`w-10 h-10 rounded-full object-cover ${!isActive ? 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}
                                />
                            ) : (
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-heading font-bold`}>
                                    {(user.username || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            {/* Online status indicator placeholder */}
                            {false && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className={`font-heading font-semibold ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'} transition-colors`}>
                                    {user.username || user.email?.split('@')[0]}
                                </span>
                                {unreadDmCounts && unreadDmCounts[user.id] > 0 && (
                                    <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                                        {unreadDmCounts[user.id] > 99 ? '99+' : unreadDmCounts[user.id]}
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs truncate ${isActive ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'} transition-colors`}>
                                {user.role || 'User'}
                            </p>
                        </div>
                    </div>
                );
            })}
            {users.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-500 text-xs">
                    No users found.
                </div>
            )}
        </>
    );
}
