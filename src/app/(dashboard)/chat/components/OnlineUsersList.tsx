'use client';

import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface OnlineUsersListProps {
    onlineUsers: User[];
    currentUserId: string | null;
}

import { ServerStats } from './ServerStats';

export function OnlineUsersList({ onlineUsers, currentUserId }: OnlineUsersListProps) {
    // Filter out current user from the list
    const filteredUsers = onlineUsers.filter(u => u.id !== currentUserId);

    return (
        <div className="w-56 flex-shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-sm hidden lg:flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Online — {filteredUsers.length}
                    </h3>
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <span className="material-icons-round text-slate-600 text-lg">person_off</span>
                        </div>
                        <p className="text-[11px] text-slate-500">No one else online</p>
                        <p className="text-[10px] text-slate-600 mt-1">Invite friends to join!</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
                        >
                            {/* Avatar with status */}
                            <div className="relative flex-shrink-0">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username || 'User'}
                                        className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/80 to-purple-700/80 flex items-center justify-center text-xs font-bold text-white ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                {/* Green online dot */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0c0c0c]" />
                            </div>

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                                    {user.username || 'Unknown'}
                                </p>
                                <p className="text-[10px] text-green-500/80">Active now</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Server Stats */}
            <div className="border-t border-white/5 bg-black/10">
                <ServerStats />
            </div>

            {/* Footer hint */}
            <div className="p-3 border-t border-white/5">
                <p className="text-[10px] text-slate-600 text-center">
                    Click to start a DM
                </p>
            </div>
        </div>
    );
}
