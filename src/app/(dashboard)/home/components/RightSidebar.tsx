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

export function RightSidebar() {
    const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchRecentChats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                // Step 1: Fetch recent DM messages (messages with recipient_id)
                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('id, content, sent_at, user_id, recipient_id')
                    .or(`user_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .not('recipient_id', 'is', null)
                    .order('sent_at', { ascending: false })
                    .limit(50) as { data: MessageRow[] | null; error: any };

                if (msgError) {
                    console.error('RightSidebar: Error fetching messages:', msgError.message);
                    setIsLoading(false);
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

                const partnerIds = Array.from(partnerMap.keys()).slice(0, 4); // Limit to 4 recent chats

                if (partnerIds.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Step 3: Fetch user details for partners
                const { data: users, error: userError } = await supabase
                    .from('users')
                    .select('id, username, avatar_url')
                    .in('id', partnerIds) as { data: UserRow[] | null; error: any };

                if (userError) {
                    console.error('RightSidebar: Error fetching users:', userError.message);
                    setIsLoading(false);
                    return;
                }

                // Step 4: Fetch online status from online_members table
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

                // Step 5: Build the recent chats array
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

                // Sort by most recent message
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


    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    return (
        <section className="w-80 flex flex-col gap-6 overflow-y-auto pb-6">
            {/* Friends Activity (Static for now) */}
            <div className="glass p-5 rounded-xl opacity-60 pointer-events-none grayscale">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Friends Activity</h3>
                <div className="space-y-5">
                    {/* ... kept static friends list as placeholder or remove if desired ... */}
                    <p className="text-xs text-slate-500">Connecting to server...</p>
                </div>
            </div>

            {/* Mini-Games - Compact Row */}
            <div className="glass p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <span className="material-icons-round text-orange-400 text-sm">sports_esports</span>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide group-hover:text-white">Mini-Games</h3>
                        <p className="text-[10px] text-slate-500">2 active sessions</p>
                    </div>
                </div>
                <span className="material-icons-round text-slate-600 group-hover:text-white transition-colors text-sm">chevron_right</span>
            </div>

            {/* Private Chats */}
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
                            // Consider online only if lastSeen is within last 5 minutes
                            const isRecentlyOnline = chat.lastSeen &&
                                (new Date().getTime() - chat.lastSeen.getTime()) < 5 * 60 * 1000;

                            return (
                                <div
                                    key={chat.id}
                                    className="flex items-center gap-3 cursor-pointer group py-2 hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition-colors"
                                    onClick={() => router.push(`/chat?userId=${chat.id}`)}
                                >
                                    {/* Avatar with status dot */}
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
                                        {/* Simple online dot */}
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d0d] ${isRecentlyOnline ? 'bg-green-500' : 'bg-slate-600'
                                            }`} />
                                    </div>

                                    {/* Chat info */}
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
