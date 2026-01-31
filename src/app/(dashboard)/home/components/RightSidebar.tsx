import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// Type interfaces for Supabase queries
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

interface RecentChat {
    id: string;
    name: string;
    avatar: string | null;
    lastMessage: string;
    sentAt: Date;
    isOnline: boolean;
    lastSeen: Date | null;
}

interface ActivityItem {
    id: string;
    type: 'online' | 'upload' | 'game_score';
    userId: string;
    username: string;
    avatar: string | null;
    timestamp: Date;
    details?: string;
    subDetails?: string;
    link?: string;
}

export function RightSidebar() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    // 1. Fetch Recent Chats (Original Logic)
    useEffect(() => {
        const fetchRecentChats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                // Step 1: Fetch recent DM messages
                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('id, content, sent_at, user_id, recipient_id')
                    .or(`user_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .not('recipient_id', 'is', null)
                    .order('sent_at', { ascending: false })
                    .limit(50) as { data: MessageRow[] | null; error: any };

                if (msgError) {
                    console.error('RightSidebar: Error fetching messages:', msgError.message);
                    setIsLoading(false); // Only stop loading if this fails critical path? Actually buzz feed handles its own Loading?
                    // Let's keep isLoading shared for simplicity or split it. Shared is fine.
                    return;
                }

                if (!messages || messages.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Step 2: Extract unique chat partner IDs
                const partnerMap = new Map<string, { lastMessage: string; sentAt: Date }>();
                messages.forEach((msg) => {
                    const partnerId = msg.user_id === user.id ? msg.recipient_id : msg.user_id;
                    if (partnerId && !partnerMap.has(partnerId)) {
                        partnerMap.set(partnerId, {
                            lastMessage: msg.content,
                            sentAt: new Date(msg.sent_at),
                        });
                    }
                });

                const partnerIds = Array.from(partnerMap.keys()).slice(0, 4);

                if (partnerIds.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Step 3: Fetch user details
                const { data: users, error: userError } = await supabase
                    .from('users')
                    .select('id, username, avatar_url')
                    .in('id', partnerIds) as { data: UserRow[] | null; error: any };

                if (userError) {
                    console.error('RightSidebar: Error fetching users:', userError.message);
                    setIsLoading(false);
                    return;
                }

                // Step 4: Fetch online status
                const { data: onlineData } = await supabase
                    .from('online_members')
                    .select('user_id, last_seen, is_online')
                    .in('user_id', partnerIds) as { data: OnlineMemberRow[] | null; error: any };

                const onlineMap = new Map<string, { isOnline: boolean; lastSeen: Date | null }>();
                onlineData?.forEach((member) => {
                    onlineMap.set(member.user_id, {
                        isOnline: member.is_online,
                        lastSeen: member.last_seen ? new Date(member.last_seen) : null,
                    });
                });

                // Step 5: Build array
                const chats: RecentChat[] = users?.map((u) => {
                    const msgData = partnerMap.get(u.id);
                    const onlineStatus = onlineMap.get(u.id);
                    return {
                        id: u.id,
                        name: u.username || 'User',
                        avatar: u.avatar_url,
                        lastMessage: msgData?.lastMessage || '',
                        sentAt: msgData?.sentAt || new Date(),
                        isOnline: onlineStatus?.isOnline || false,
                        lastSeen: onlineStatus?.lastSeen || null,
                    };
                }) || [];

                chats.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
                setRecentChats(chats);
            } catch (err) {
                console.error('RightSidebar: Unexpected error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentChats();
    }, []);

    // 2. Fetch Buzz Feed (New Logic)
    useEffect(() => {
        const fetchBuzz = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // A. Online Users
            const { data: onlineData } = await supabase
                .from('online_members')
                .select('user_id, username, last_seen')
                .eq('is_online', true)
                .limit(5);

            // B. Recent Uploads
            // Note: Depending on RLS, may only see public files or channel files.
            const { data: recentFiles } = await supabase
                .from('files')
                .select('id, display_name, file_type, created_at, uploader:users!uploader_id(id, username, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(20);

            // C. Game Scores
            const { data: topScores } = await supabase
                .from('game_scores')
                .select('id, score, game_id, created_at, user:users!user_id(id, username, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(5);

            let feed: ActivityItem[] = [];

            // Map Online
            onlineData?.forEach((u: any) => {
                // Don't show self
                if (u.user_id === user.id) return;

                feed.push({
                    id: `online-${u.user_id}`,
                    type: 'online',
                    userId: u.user_id,
                    username: u.username || 'User',
                    avatar: null, // Basic query doesn't join users table for avatar in online_members usually, need to fix if critical.
                    // Assuming online_members might join or we fetch separate. 
                    // For robustness, let's use what we have or placeholder.
                    timestamp: new Date(),
                    details: 'Is Online',
                    link: `/chat?userId=${u.user_id}`
                });
            });

            // Map Files
            // Map Files (Limit 2 per user)
            const uploadsByUser: Record<string, number> = {};
            recentFiles?.forEach((f: any) => {
                const uid = f.uploader?.id;
                if (!uid) return;

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

            // Map Scores
            topScores?.forEach((s: any) => {
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

            // Sort by date desc
            feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setActivities(feed.slice(0, 10));
        };
        fetchBuzz();
    }, []);

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'upload': return 'cloud_upload';
            case 'game_score': return 'emoji_events';
            default: return 'circle';
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'upload': return 'text-blue-400';
            case 'game_score': return 'text-amber-400';
            default: return 'text-green-500';
        }
    };

    return (
        <section className="w-80 flex flex-col gap-6 overflow-y-auto pb-6">
            {/* 1. Friends Buzz Feed */}
            <div className="glass p-5 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Friends Buzz</h3>
                    <span className="material-icons-round text-slate-600 text-sm">bolt</span>
                </div>

                <div className="space-y-4">
                    {activities.length > 0 ? (
                        activities.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 cursor-pointer group" onClick={() => item.link && router.push(item.link)}>
                                <div className="relative mt-0.5">
                                    {item.avatar ? (
                                        <img src={item.avatar} className="w-8 h-8 rounded-full object-cover" alt={item.username} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                                            {item.username[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0d0d0d] flex items-center justify-center border-2 border-[#1a1b1e]`}>
                                        <span className={`material-icons-round text-[10px] ${getActivityColor(item.type)}`}>
                                            {getActivityIcon(item.type)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white group-hover:text-violet-400 transition-colors">
                                        {item.username}
                                    </p>
                                    <p className="text-[11px] text-slate-400 leading-tight">
                                        {item.details} <span className="text-slate-500">{item.subDetails && `• ${item.subDetails}`}</span>
                                    </p>
                                </div>
                                <span className="text-[9px] text-slate-600 whitespace-nowrap mt-1">
                                    {Math.floor((Date.now() - item.timestamp.getTime()) / 60000)}m
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-slate-500 italic">No recent buzz...</p>
                    )}
                </div>
            </div>

            {/* 2. Mini-Games Link */}
            <div
                onClick={() => router.push('/games/galaxy-match')}
                className="glass p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <span className="material-icons-round text-orange-400 text-sm">sports_esports</span>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide group-hover:text-white">Galaxy Match</h3>
                        <p className="text-[10px] text-slate-500">Play now</p>
                    </div>
                </div>
                <span className="material-icons-round text-slate-600 group-hover:text-white transition-colors text-sm">chevron_right</span>
            </div>

            {/* 3. Recent Chats */}
            <div className="glass p-5 rounded-xl flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Chats</h3>
                    <button className="text-slate-500 hover:text-white">
                        <span className="material-icons-round text-sm">add</span>
                    </button>
                </div>
                <div className="space-y-4">
                    {isLoading ? (
                        <p className="text-xs text-slate-500 italic">Loading chats...</p>
                    ) : recentChats.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No recent chats</p>
                    ) : (
                        recentChats.map((chat) => {
                            const isRecentlyOnline = chat.lastSeen &&
                                (new Date().getTime() - chat.lastSeen.getTime()) < 5 * 60 * 1000;

                            return (
                                <div
                                    key={chat.id}
                                    className="flex items-center gap-3 cursor-pointer group py-2 hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition-colors"
                                    onClick={() => router.push(`/chat?userId=${chat.id}`)}
                                >
                                    <div className="relative flex-shrink-0">
                                        {chat.avatar ? (
                                            <img
                                                alt={chat.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                                src={chat.avatar}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600/80 to-purple-700/80 flex items-center justify-center text-sm font-semibold text-white">
                                                {chat.name[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d0d] ${isRecentlyOnline ? 'bg-green-500' : 'bg-slate-600'}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                                                {chat.name}
                                            </p>
                                            <span className="text-[10px] text-slate-600 whitespace-nowrap">
                                                {formatTimeAgo(chat.sentAt)}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate mt-0.5 ${isRecentlyOnline
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
            </div>
        </section>
    );
}
