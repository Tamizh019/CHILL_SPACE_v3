'use client';

import { useState } from 'react';
import { Database } from '@/types/supabase';
import { ServerStats } from './ServerStats';
import { motion, AnimatePresence } from 'framer-motion';

type User = Database['public']['Tables']['users']['Row'];

interface OnlineUsersListProps {
    onlineUsers: User[];
    currentUserId: string | null;
}

export function OnlineUsersList({ onlineUsers, currentUserId }: OnlineUsersListProps) {
    // Filter out current user from the list
    const filteredUsers = onlineUsers.filter(u => u.id !== currentUserId);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 70 : 240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-sm hidden lg:flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-white/5`}>
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                Online — {filteredUsers.length}
                            </h3>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors
                        ${isCollapsed ? '' : 'ml-2'}`}
                    title={isCollapsed ? "Expand Members" : "Collapse Members"}
                >
                    <span className="material-icons-round text-sm">
                        {isCollapsed ? 'chevron_left' : 'chevron_right'}
                    </span>
                </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                        <span className="material-icons-round text-slate-600 text-lg">person_off</span>
                        {!isCollapsed && (
                            <p className="text-[10px] text-slate-500 mt-2">No one online</p>
                        )}
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className={`flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group
                                ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? user.username || 'User' : ''}
                        >
                            {/* Avatar with status */}
                            <div className="relative flex-shrink-0">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username || 'User'}
                                        className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600/80 to-purple-700/80 flex items-center justify-center text-xs font-bold text-white ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                {/* Green online dot */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0c0c0c]" />
                            </div>

                            {/* User info - Only visible when not collapsed */}
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="flex-1 min-w-0"
                                    >
                                        <p className="text-sm font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                                            {user.username || 'Unknown'}
                                        </p>
                                        <p className="text-[10px] text-green-500/80">Active now</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* Server Stats footer - only show when expanded */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex-shrink-0 border-t border-white/5 bg-black/10 overflow-hidden"
                    >
                        <ServerStats />

                        {/* Footer hint */}
                        <div className="p-3 border-t border-white/5">
                            <p className="text-[10px] text-slate-600 text-center">
                                Click to start a DM
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
