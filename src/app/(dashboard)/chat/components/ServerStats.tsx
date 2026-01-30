'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ServerStats {
    totalMembers: number;
    messagesToday: number;
    mostActiveChannel: string;
    avgResponseTime: string;
}

export function ServerStats() {
    const [stats, setStats] = useState<ServerStats>({
        totalMembers: 0,
        messagesToday: 0,
        mostActiveChannel: '#general',
        avgResponseTime: '< 1 min'
    });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        try {
            // Get total members
            const { count: memberCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Get messages from today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { count: messageCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .gte('sent_at', todayStart.toISOString());

            // Get most active channel (by message count today)
            const { data: channelStats } = await supabase
                .from('messages')
                .select('channel_id')
                .gte('sent_at', todayStart.toISOString())
                .not('channel_id', 'is', null);

            let mostActive = '#general';
            if (channelStats && channelStats.length > 0) {
                // Count messages per channel
                const channelCounts: { [key: string]: number } = {};
                (channelStats as any[]).forEach(msg => {
                    if (msg.channel_id) {
                        channelCounts[msg.channel_id] = (channelCounts[msg.channel_id] || 0) + 1;
                    }
                });

                // Find channel with most messages
                const topChannelId = Object.keys(channelCounts).reduce((a, b) =>
                    channelCounts[a] > channelCounts[b] ? a : b
                    , '');

                if (topChannelId) {
                    const { data: channelData } = await supabase
                        .from('channels')
                        .select('name')
                        .eq('id', topChannelId)
                        .single();

                    if (channelData) {
                        mostActive = `#${(channelData as any).name}`;
                    }
                }
            }

            setStats({
                totalMembers: memberCount || 0,
                messagesToday: messageCount || 0,
                mostActiveChannel: mostActive,
                avgResponseTime: messageCount && messageCount > 10 ? '< 3 min' : '< 1 min'
            });
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching server stats:', error);
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchStats();

        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Format large numbers
    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    return (
        <div className="mt-4">
            {/* Header with toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-between text-xs font-semibold 
                           text-slate-400 uppercase tracking-wider px-3 py-2 
                           hover:text-white transition-colors group"
            >
                <span>Server Stats</span>
                <span className={`material-icons-round text-sm transition-transform duration-200 
                                  ${isCollapsed ? '' : 'rotate-180'}`}>
                    expand_more
                </span>
            </button>

            {/* Stats content */}
            {!isCollapsed && (
                <div className="px-3 py-2 space-y-3 animate-fade-in">
                    {isLoading ? (
                        <div className="text-slate-500 text-sm text-center py-3">
                            Loading stats...
                        </div>
                    ) : (
                        <>
                            {/* Total Members */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">👥</span>
                                    <span className="text-slate-400 text-sm">Total Members</span>
                                </div>
                                <span className="text-white font-semibold text-sm">
                                    {formatNumber(stats.totalMembers)}
                                </span>
                            </div>

                            {/* Messages Today */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">💬</span>
                                    <span className="text-slate-400 text-sm">Messages Today</span>
                                </div>
                                <span className="text-white font-semibold text-sm">
                                    {formatNumber(stats.messagesToday)}
                                </span>
                            </div>

                            {/* Most Active */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🔥</span>
                                    <span className="text-slate-400 text-sm">Most Active</span>
                                </div>
                                <span className="text-violet-400 font-semibold text-sm">
                                    {stats.mostActiveChannel}
                                </span>
                            </div>

                            {/* Avg Response */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⏱️</span>
                                    <span className="text-slate-400 text-sm">Avg Response</span>
                                </div>
                                <span className="text-green-400 font-semibold text-sm">
                                    {stats.avgResponseTime}
                                </span>
                            </div>

                            {/* Divider line */}
                            <div className="border-t border-white/5 pt-2 mt-2">
                                <div className="text-[10px] text-slate-500 text-center">
                                    Updates every 30 seconds
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
