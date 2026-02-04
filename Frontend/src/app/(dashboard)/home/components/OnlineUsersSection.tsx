'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface OnlineUser {
    id: string;
    username: string | null;
    avatar_url: string | null;
    last_seen: string | null;
}

export function OnlineUsersSection() {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch online users (exclude current user)
                const { data } = await supabase
                    .from('online_members')
                    .select(`
                        user_id,
                        last_seen,
                        is_online,
                        user:users!user_id(
                            id,
                            username,
                            avatar_url
                        )
                    `)
                    .eq('is_online', true);

                if (data) {
                    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

                    const users = data
                        .filter((item: any) => {
                            // Exclude current user
                            if (item.user_id === user.id) return false;
                            // Only include users active in last 5 minutes
                            const lastSeen = item.last_seen ? new Date(item.last_seen).getTime() : 0;
                            return lastSeen > fiveMinutesAgo;
                        })
                        .map((item: any) => ({
                            id: item.user_id,
                            username: item.user?.username || 'Unknown User',
                            avatar_url: item.user?.avatar_url,
                            last_seen: item.last_seen
                        }));

                    setOnlineUsers(users);
                }
            } catch (error) {
                console.error('Error fetching online users:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOnlineUsers();

        // Set up realtime subscription for online members
        const channel = supabase
            .channel('online-members-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'online_members'
                },
                () => {
                    fetchOnlineUsers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-xs text-slate-500 italic">Loading online users...</p>
            </div>
        );
    }

    if (onlineUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                <Users size={24} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">No one online right now</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {onlineUsers.map((user) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
                >
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
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0c0c0c] animate-pulse" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                            {user.username || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-green-500/80">Active now</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
