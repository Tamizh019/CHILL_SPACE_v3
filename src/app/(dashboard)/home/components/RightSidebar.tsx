import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function RightSidebar() {
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchRecentChats = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch messages involving the user
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    content,
                    sent_at,
                    user_id,
                    recipient_id,
                    sender:user_id ( id, username, avatar_url ),
                    recipient:recipient_id ( id, username, avatar_url )
                `)
                .or(`user_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .not('recipient_id', 'is', null) // Only DMs
                .order('sent_at', { ascending: false })
                .limit(50); // Fetch enough to find distinct chats

            if (messages) {
                const chatsMap = new Map();

                messages.forEach((msg: any) => {
                    // Determine who the other person is
                    const isMe = msg.user_id === user.id;
                    const partner = isMe ? msg.recipient : msg.sender;

                    if (!partner) return;

                    if (!chatsMap.has(partner.id)) {
                        chatsMap.set(partner.id, {
                            id: partner.id,
                            name: partner.username || 'User',
                            avatar: partner.avatar_url,
                            lastMessage: msg.content,
                            sentAt: new Date(msg.sent_at),
                        });
                    }
                });

                setRecentChats(Array.from(chatsMap.values()));
            }
            setIsLoading(false);
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
                        recentChats.map((chat) => (
                            <div
                                key={chat.id}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => router.push(`/chat?userId=${chat.id}`)} // This query param needs handling in Chat page or just /chat for now
                            >
                                <div className="relative">
                                    {chat.avatar ? (
                                        <img
                                            alt={chat.name}
                                            className="w-9 h-9 rounded-full grayscale group-hover:grayscale-0 transition-all object-cover"
                                            src={chat.avatar}
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                            {chat.name[0]}
                                        </div>
                                    )}
                                    {/* Status Dot (Fake for now, or based on recency) */}
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-600 border-2 border-black rounded-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-medium truncate text-white">{chat.name}</p>
                                        <span className="text-[10px] text-slate-600 ml-2 whitespace-nowrap">{formatTimeAgo(chat.sentAt)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                                        {chat.lastMessage}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
