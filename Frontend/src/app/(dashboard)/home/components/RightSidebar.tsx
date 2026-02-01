import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentActivity, ActivityItem, RecentChat, LevelData } from '@/context/RecentActivityContext';
import {
    Sprout,
    Radar,
    Compass,
    Rocket,
    Crown,
    Zap,
    Info,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Gamepad2,
    UploadCloud
} from 'lucide-react';

// Type interfaces for Supabase queries and local types
interface MessageRow {
    id: string;
    content: string;
    sent_at: string;
    user_id: string;
    recipient_id: string | null;
}

interface UserRow {
    id: string;
    username: string | null;
    avatar_url: string | null;
}

interface OnlineMemberRow {
    user_id: string;
    last_seen: string | null;
    is_online: boolean;
}

// Level System Configuration
const LEVEL_TIERS = [
    { min: 1, max: 5, title: 'Novice', Icon: Sprout, color: 'text-emerald-400', from: 'from-emerald-400', to: 'to-emerald-600' },
    { min: 6, max: 10, title: 'Scout', Icon: Radar, color: 'text-cyan-400', from: 'from-cyan-400', to: 'to-cyan-600' },
    { min: 11, max: 15, title: 'Explorer', Icon: Compass, color: 'text-blue-400', from: 'from-blue-400', to: 'to-blue-600' },
    { min: 16, max: 20, title: 'Captain', Icon: Rocket, color: 'text-violet-400', from: 'from-violet-400', to: 'to-violet-600' },
    { min: 21, max: 9999, title: 'Legend', Icon: Crown, color: 'text-amber-400', from: 'from-amber-400', to: 'to-amber-600' },
];

const getLevelTier = (level: number) => {
    return LEVEL_TIERS.find(t => level >= t.min && level <= t.max) || LEVEL_TIERS[LEVEL_TIERS.length - 1];
};

import { useGlobalStore } from '@/context/GlobalStoreContext';
// ... imports

export function RightSidebar() {
    const { sidebarData, updateSidebarData } = useRecentActivity();
    const { user } = useGlobalStore(); // Use cached user
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(sidebarData.lastFetched === 0);
    const [showRankGuide, setShowRankGuide] = useState(false);

    // Collapsible State (Local UI state doesn't need to be global)
    const [expanded, setExpanded] = useState({
        buzz: true,
        rank: true,
        chats: true
    });

    const toggleSection = (section: keyof typeof expanded) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // 1. Fetch Data (Only if stale > 60s or empty)
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return; // Wait for global user

            const isStale = (Date.now() - sidebarData.lastFetched) > 60000;
            if (!isStale && sidebarData.lastFetched > 0) {
                setIsLoading(false);
                return;
            }

            // Removed supabase.auth.getUser() call


            // PARALLEL FETCHING for speed
            const [scoresRes, filesRes, onlineRes, recentFilesRes, topScoresRes, messagesRes] = await Promise.all([
                // Level Stats
                supabase.from('game_scores').select('score').eq('user_id', user.id),
                supabase.from('files').select('*', { count: 'exact', head: true }).eq('uploader_id', user.id),

                // Buzz Feed
                supabase.from('online_members').select(`user_id, last_seen, is_online, user:users!user_id(id, username, avatar_url)`).eq('is_online', true).limit(5),
                supabase.from('files').select('id, display_name, file_type, created_at, uploader:users!uploader_id(id, username, avatar_url)').order('created_at', { ascending: false }).limit(20),
                supabase.from('game_scores').select('id, score, game_id, created_at, user:users!user_id(id, username, avatar_url)').order('created_at', { ascending: false }).limit(5),

                // Recent Chats (simplified Fetch)
                supabase.from('messages').select('id, content, sent_at, user_id, recipient_id').or(`user_id.eq.${user.id},recipient_id.eq.${user.id}`).not('recipient_id', 'is', null).order('sent_at', { ascending: false }).limit(50)
            ]);

            // --- PROCESS LEVEL DATA ---
            const totalScore = scoresRes.data?.reduce((acc: any, curr: any) => acc + (curr.score || 0), 0) || 0;
            const gameXP = Math.floor(totalScore * 0.1);
            const uploadXP = (filesRes.count || 0) * 50;
            const totalXP = gameXP + uploadXP;
            const level = Math.floor(totalXP / 1000) + 1;
            const currentXP = totalXP % 1000;

            const newLevelData: LevelData = { level, currentXP, nextXP: 1000 };

            // --- PROCESS BUZZ FEED ---
            let feed: ActivityItem[] = [];
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

            onlineRes.data?.forEach((u: any) => {
                if (u.user_id === user.id) return;
                const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
                if (!lastSeen || lastSeen.getTime() < fiveMinutesAgo) return;

                feed.push({
                    id: `online-${u.user_id}`,
                    type: 'online',
                    userId: u.user_id,
                    username: u.user?.username || 'User',
                    avatar: u.user?.avatar_url,
                    timestamp: lastSeen,
                    details: 'Is Online',
                    link: `/chat?userId=${u.user_id}`
                });
            });

            const uploadsByUser: Record<string, number> = {};
            recentFilesRes.data?.forEach((f: any) => {
                const uid = f.uploader?.id;
                if (!uid) return;
                if (uid === user.id) return;
                const count = uploadsByUser[uid] || 0;
                if (count < 2) {
                    feed.push({
                        id: `file-${f.id}`,
                        type: 'upload',
                        userId: uid,
                        username: f.uploader?.username || 'Unknown',
                        avatar: f.uploader?.avatar_url,
                        timestamp: new Date(f.created_at),
                        details: 'Uploaded a file',
                        subDetails: f.display_name,
                        link: '/chat'
                    });
                    uploadsByUser[uid] = count + 1;
                }
            });

            const seenScores = new Set<string>();
            topScoresRes.data?.forEach((s: any) => {
                if (s.user?.id === user.id) return;
                const uniqueKey = `${s.user?.id}-${s.game_id}-${s.score}`;
                if (seenScores.has(uniqueKey)) return;
                seenScores.add(uniqueKey);
                feed.push({
                    id: `score-${s.id}`,
                    type: 'game_score',
                    userId: s.user?.id,
                    username: s.user?.username || 'Gamer',
                    avatar: s.user?.avatar_url,
                    timestamp: new Date(s.created_at),
                    details: `Scored ${s.score}`,
                    subDetails: s.game_id === 'galaxy-match' ? 'in Galaxy Match' : 'in Game',
                    link: '/games/galaxy-match'
                });
            });

            feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            // --- PROCESS RECENT CHATS ---
            const messages = messagesRes.data as MessageRow[] || [];
            const partnerMap = new Map<string, { lastMessage: string; sentAt: Date }>();
            messages.forEach((msg) => {
                const partnerId = msg.user_id === user.id ? msg.recipient_id : msg.user_id;
                if (partnerId && !partnerMap.has(partnerId)) {
                    partnerMap.set(partnerId, { lastMessage: msg.content, sentAt: new Date(msg.sent_at) });
                }
            });
            const partnerIds = Array.from(partnerMap.keys()).slice(0, 4);

            let chats: RecentChat[] = [];
            if (partnerIds.length > 0) {
                const { data: users } = await supabase.from('users').select('id, username, avatar_url').in('id', partnerIds);
                const { data: onlineUsers } = await supabase.from('online_members').select('user_id, last_seen, is_online').in('user_id', partnerIds);

                const onlineMap = new Map<string, any>();
                onlineUsers?.forEach((o: any) => onlineMap.set(o.user_id, o));

                chats = users?.map((u: any) => ({
                    id: u.id,
                    name: u.username || 'User',
                    avatar: u.avatar_url,
                    lastMessage: partnerMap.get(u.id)?.lastMessage || '',
                    sentAt: partnerMap.get(u.id)?.sentAt || new Date(),
                    isOnline: onlineMap.get(u.id)?.is_online || false,
                    lastSeen: onlineMap.get(u.id)?.last_seen ? new Date(onlineMap.get(u.id)?.last_seen) : null
                })) || [];
                chats.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
            }

            // UPDATE CONTEXT
            updateSidebarData({
                activities: feed.slice(0, 10),
                levelData: newLevelData,
                recentChats: chats
            });
            setIsLoading(false);
        };

        fetchData();
    }, []); // Run on mount (but efficiently thanks to internal check)


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatTimeAgo = (date: Date) => {
        if (!mounted) return ''; // Prevent hydration mismatch by rendering nothing on server/initial client
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diffInMinutes < 1) return '0m';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        return `${Math.floor(diffInHours / 24)}d`;
    };

    const tier = getLevelTier(sidebarData.levelData.level);

    return (
        <section className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pb-6 relative no-scrollbar h-full">

            {/* RANK GUIDE MODAL - MATCHING "SIGN OUT" STYLE */}
            <AnimatePresence>
                {showRankGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowRankGuide(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Glow Effect from Sign Out Modal */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

                            <h3 className="text-xl font-semibold text-white mb-2 relative z-10 flex justify-between items-center">
                                Rank Guide
                            </h3>
                            <p className="text-slate-400 text-sm mb-6 relative z-10">
                                Earn XP to level up and unlock new badges!
                            </p>

                            <div className="space-y-4 relative z-10">
                                {/* Friendly XP Tips */}
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                                        <Gamepad2 size={20} className="text-amber-400 mb-2" />
                                        <p className="text-xs font-medium text-white">Play Games</p>
                                        <p className="text-[10px] text-slate-500">+10% Score as XP</p>
                                    </div>
                                    <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                                        <UploadCloud size={20} className="text-blue-400 mb-2" />
                                        <p className="text-xs font-medium text-white">Share Files</p>
                                        <p className="text-[10px] text-slate-500">+50 XP per Upload</p>
                                    </div>
                                </div>

                                {/* Rank List - Simplified */}
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                    {LEVEL_TIERS.map((t) => {
                                        const isCurrent = sidebarData.levelData.level >= t.min && sidebarData.levelData.level <= t.max;
                                        return (
                                            <div
                                                key={t.title}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${isCurrent
                                                    ? 'bg-violet-500/10 border border-violet-500/20'
                                                    : 'hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className={`p-1.5 rounded-md ${isCurrent ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                                                    <t.Icon className={`${t.color}`} size={16} />
                                                </div>
                                                <div className="flex-1 flex justify-between items-center">
                                                    <span className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                                                        {t.title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600 font-mono">
                                                        Lvl {t.min}-{t.max > 100 ? '∞' : t.max}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRankGuide(false)}
                                className="w-full mt-6 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. Friends Buzz Feed - Collapsible using Cached Data */}
            <div className="glass rounded-2xl border border-white/5 backdrop-blur-xl overflow-hidden flex-shrink-0">
                <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleSection('buzz')}
                >
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Friends Buzz
                        <Zap size={12} className="text-slate-600" />
                    </h3>
                    {expanded.buzz ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
                </div>

                <AnimatePresence>
                    {expanded.buzz && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            <div className="px-5 pb-5 space-y-4">
                                {isLoading && sidebarData.activities.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-2">Loading buzz...</p>
                                ) : sidebarData.activities.length > 0 ? (
                                    sidebarData.activities.map((item) => (
                                        <div key={item.id} className="flex items-start gap-3.5 cursor-pointer group" onClick={() => item.link && router.push(item.link)}>
                                            <div className="relative mt-0.5">
                                                {item.avatar ? (
                                                    <img src={item.avatar} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/10 transition-all" alt={item.username} />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                                        {item.username[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#0d0d0d] flex items-center justify-center border-2 border-[#1a1b1e]">
                                                    {item.type === 'upload' && <UploadCloud size={8} className="text-blue-400" />}
                                                    {item.type === 'game_score' && <Gamepad2 size={8} className="text-amber-400" />}
                                                    {item.type === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors truncate pr-2">
                                                        {item.username}
                                                    </p>
                                                    <span className="text-[9px] text-slate-600 whitespace-nowrap">
                                                        {formatTimeAgo(new Date(item.timestamp))}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-snug mt-0.5 truncate">
                                                    {item.details}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500 italic text-center py-2">No active buzz...</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Level Progress Premium Card - Collapsible */}
            <div className={`glass rounded-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden flex-shrink-0 group overflow-hidden`}>
                <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleSection('rank')}
                >
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Rank System
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowRankGuide(true); }}
                            className="text-slate-600 hover:text-white transition-colors"
                        >
                            <Info size={12} />
                        </button>
                    </h3>
                    <div className="flex items-center gap-3">
                        {!expanded.rank && (
                            <div className={`p-1 rounded bg-white/5 ${tier.color}`}>
                                <tier.Icon size={12} />
                            </div>
                        )}
                        {expanded.rank ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
                    </div>
                </div>

                <AnimatePresence>
                    {expanded.rank && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            <div className="px-5 pb-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold text-white tracking-tight leading-none">
                                                Lvl {sidebarData.levelData.level}
                                            </span>
                                            <span className={`text-xs font-bold ${tier.color} mb-1 opacity-90`}>
                                                {tier.title}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${tier.color}`}>
                                        <tier.Icon size={20} />
                                    </div>
                                </div>

                                {/* Minimal Progress Bar */}
                                <div className="w-full h-1.5 bg-black/40 rounded-full mb-2 overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full bg-gradient-to-r ${tier.from} ${tier.to} rounded-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${(sidebarData.levelData.currentXP / sidebarData.levelData.nextXP) * 100}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                    <span className="text-slate-400">{sidebarData.levelData.currentXP} XP</span>
                                    <span>{sidebarData.levelData.nextXP} XP</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. Recent Chats - Collapsible using Cached Data */}
            <div className="glass rounded-2xl backdrop-blur-xl border border-white/5 flex-shrink-0">
                <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleSection('chats')}
                >
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Recent Chats
                        <MessageSquare size={12} className="text-slate-600" />
                    </h3>
                    <div className="flex items-center gap-3">
                        {expanded.chats && (
                            <button onClick={(e) => { e.stopPropagation(); router.push('/chat'); }} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-icons-round text-lg">add_circle_outline</span>
                            </button>
                        )}
                        {expanded.chats ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
                    </div>
                </div>

                <AnimatePresence>
                    {expanded.chats && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            <div className="px-5 pb-5 space-y-2">
                                {isLoading && sidebarData.recentChats.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-2">Loading chats...</p>
                                ) : sidebarData.recentChats.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-2">No recent chats</p>
                                ) : (
                                    sidebarData.recentChats.map((chat) => {
                                        const isRecentlyOnline = chat.lastSeen &&
                                            (new Date().getTime() - new Date(chat.lastSeen).getTime()) < 5 * 60 * 1000;

                                        return (
                                            <div
                                                key={chat.id}
                                                className="flex items-center gap-3 cursor-pointer group py-2 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-all duration-200"
                                                onClick={() => router.push(`/chat?userId=${chat.id}`)}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    {chat.avatar ? (
                                                        <img
                                                            alt={chat.name}
                                                            className="w-8 h-8 rounded-full object-cover shadow-sm group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all"
                                                            src={chat.avatar}
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/80 to-purple-700/80 flex items-center justify-center text-[10px] font-semibold text-white shadow-sm">
                                                            {chat.name[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#131416] ${isRecentlyOnline ? 'bg-green-500' : 'bg-slate-600'}`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                                            {chat.name}
                                                        </p>
                                                        <span className="text-[9px] text-slate-600 whitespace-nowrap">
                                                            {formatTimeAgo(new Date(chat.sentAt))}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[10px] truncate mt-0.5 font-medium ${isRecentlyOnline
                                                        ? 'text-green-500'
                                                        : 'text-slate-500 group-hover:text-slate-400'
                                                        }`}>
                                                        {isRecentlyOnline ? 'Active Now' : (chat.lastMessage || 'No messages')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
