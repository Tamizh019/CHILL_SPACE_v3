import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';

// Extended Message type to include joined user data from queries
type Message = Database['public']['Tables']['messages']['Row'] & {
    users: {
        avatar_url: string | null;
        role: string | null;
    } | null;
};
type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // State for Direct Messages
    const [users, setUsers] = useState<User[]>([]);
    const [recipient, setRecipient] = useState<User | null>(null);

    // 1. Fetch Current User
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setCurrentUser(profile);
            }
        };
        fetchUser();
    }, []);

    // 2. Fetch Channels
    useEffect(() => {
        const fetchChannels = async () => {
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error fetching channels:', error.message, error.details, error.hint);
                console.log('Full error object:', JSON.stringify(error, null, 2));
            } else if (data) {
                // Inject Announcements Channel
                const announcements: any = {
                    id: 'announcements',
                    name: 'Announcements',
                    type: 'system',
                    description: 'Official updates and news from the Chill Space team.'
                };

                const allChannels = [announcements, ...data];
                setChannels(allChannels);

                // Default to first channel if none selected
                if (!currentChannel && allChannels.length > 0) {
                    // Prefer "General" if it exists, else Announcements or first
                    const general = allChannels.find(c => c.name === 'General');
                    setCurrentChannel(general || allChannels[0]);
                }
            }
        };

        fetchChannels();

        // Subscribe to new channels
        const channelSubscription = supabase
            .channel('public:channels')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channels' }, (payload) => {
                setChannels(prev => {
                    const existing = prev.filter(c => c.id !== 'announcements');
                    const newChannels = [...existing, payload.new as Channel].sort((a, b) => a.name.localeCompare(b.name));
                    // Keep Announcements at top
                    return [{
                        id: 'announcements',
                        name: 'Announcements',
                        description: 'Official updates and news from the Chill Space team.'
                    } as any, ...newChannels];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelSubscription);
        };
    }, []); // Run once on mount

    // 3. Fetch Messages for Current Channel
    useEffect(() => {
        if (!currentChannel) return;
        if (recipient) return; // Don't fetch channel messages if viewing a DM

        const fetchMessages = async () => {
            setIsLoading(true);

            // SPECIAL HANDLING: Announcements Channel
            if (currentChannel.id === 'announcements') {
                const { data, error } = await supabase
                    .from('global_alerts')
                    .select('*')
                    .eq('is_active', true) // Optional: only show active alerts
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Error fetching announcements:', error);
                } else if (data) {
                    const formattedMessages = data.map((alert: any) => ({
                        id: alert.id,
                        content: alert.message,
                        sent_at: alert.created_at,
                        user_id: 'system',
                        username: 'Tamizharasan', // Hardcoded admin name as requested
                        recipient_id: null,
                        channel_id: 'announcements',
                        users: {
                            avatar_url: '/logo1.svg', // Use app logo as avatar
                            role: 'owner'
                        }
                    }));
                    setMessages(formattedMessages as any);
                }
                setIsLoading(false);
                return;
            }

            let query = supabase
                .from('messages')
                .select(`
                    *,
                    users:user_id ( avatar_url, role )
                `)
                .order('sent_at', { ascending: true });

            // Special handling for "General" channel to include legacy messages (null channel_id) AND ensure they are not DMs (null recipient_id)
            if (currentChannel.name === 'General') {
                query = query.or(`channel_id.eq.${currentChannel.id},and(channel_id.is.null,recipient_id.is.null)`);
            } else {
                query = query.eq('channel_id', currentChannel.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data as any); // Type cast needed due to join
            }
            setIsLoading(false);
        };

        fetchMessages();

        // 4. Real-time Message Subscription
        if (recipient) return; // Don't subscribe to channel updates if viewing a DM

        const channelFilter = currentChannel.name === 'General'
            ? `channel_id=eq.${currentChannel.id}`
            : `channel_id=eq.${currentChannel.id}`;

        const messageSubscription = supabase
            .channel(`channel:${currentChannel.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: channelFilter
            }, async (payload) => {
                await handleNewMessage(payload.new as Message);
            });

        // Additional listener for legacy messages (General only)
        if (currentChannel.name === 'General') {
            messageSubscription.on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: 'channel_id=is.null'
            }, async (payload) => {
                // CRITICAL: Filter out private messages (DMs have recipient_id, public ones don't)
                const msg = payload.new as Message;
                if (msg.recipient_id === null) {
                    await handleNewMessage(msg);
                }
            });
        }

        const handleNewMessage = async (newMsg: Message) => {
            // Double check to strictly avoid DMs in channels
            if (currentChannel.name === 'General' && newMsg.recipient_id !== null) return;
            if (recipient) return; // Extra safety: don't update if in DM mode

            // Avoid duplicates if we somehow get double events (unlikely with different filters)
            setMessages(prev => {
                if (prev.find(m => m.id === newMsg.id)) return prev;

                // We need to fetch the user details separately
                // (Optimizing to not fetch if we already have it would be nice, but for now safe)
                return [...prev, newMsg as any]; // Optimistic add, will update with user data async
            });

            const { data: sender } = await supabase
                .from('users')
                .select('avatar_url, role')
                .eq('id', newMsg.user_id)
                .single();

            setMessages(prev => prev.map(msg =>
                msg.id === newMsg.id ? { ...msg, users: sender } : msg
            ) as any);
        };

        messageSubscription.subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [currentChannel, recipient]);

    // 5. Send Message Function
    const sendMessage = async (content: string) => {
        if (!currentChannel || !currentUser || !content.trim()) return;

        // Handle Announcements
        if (currentChannel.id === 'announcements') {
            const { error } = await supabase
                .from('global_alerts')
                .insert({
                    message: content,
                    type: 'info',
                    is_active: true
                });

            if (error) {
                console.error('Error sending announcement:', error);
            } else {
                // Optimistic update for immediate feedback
                const optimisticMsg: any = {
                    id: Date.now().toString(), // Temporary ID
                    content: content,
                    sent_at: new Date().toISOString(),
                    user_id: 'system',
                    username: 'Tamizharasan',
                    recipient_id: null,
                    channel_id: 'announcements',
                    users: { avatar_url: '/logo1.svg', role: 'owner' }
                };
                setMessages(prev => [...prev, optimisticMsg]);
            }
            return;
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                content,
                channel_id: currentChannel.id,
                user_id: currentUser.id,
                username: currentUser.username,
                sent_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error sending message:', error);
        }
    };

    // State moved to top
    // ... Existing useEffects ...

    // ... Existing useEffects ...

    // 6. Fetch All Users (for DM sidebar)
    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) return;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .neq('id', currentUser.id)
                .order('username');

            if (error) {
                console.error('Error fetching users:', error);
            } else {
                setUsers(data);
            }
        };

        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    // 7. Fetch Private Messages
    useEffect(() => {
        if (!recipient || !currentUser) return;

        const fetchPrivateMessages = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select(`*, users:user_id ( avatar_url, role )`)
                .or(`and(user_id.eq.${currentUser.id},recipient_id.eq.${recipient.id}),and(user_id.eq.${recipient.id},recipient_id.eq.${currentUser.id})`)
                .order('sent_at', { ascending: true });

            if (error) {
                console.error('Error fetching DMs:', error);
            } else {
                setMessages(data as any);
            }
            setIsLoading(false);
        };

        fetchPrivateMessages();

        // Subscribe to DMs
        const dmSubscription = supabase
            .channel(`dm:${currentUser.id}-${recipient.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `recipient_id=in.(${currentUser.id},${recipient.id})` // Simplistic filter, ideally needed stricter RLS
            }, async (payload) => {
                const newMsg = payload.new as Message;
                // Only add if it belongs to this conversation
                if (
                    (newMsg.user_id === currentUser.id && newMsg.recipient_id === recipient.id) ||
                    (newMsg.user_id === recipient.id && newMsg.recipient_id === currentUser.id)
                ) {
                    const { data: sender } = await supabase
                        .from('users')
                        .select('avatar_url, role')
                        .eq('id', newMsg.user_id)
                        .single();

                    setMessages(prev => [...prev, { ...newMsg, users: sender } as any]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(dmSubscription);
        };
    }, [recipient, currentUser]);

    // Send DM
    const sendDirectMessage = async (content: string) => {
        if (!recipient || !currentUser || !content.trim()) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                content,
                user_id: currentUser.id,
                recipient_id: recipient.id,
                username: currentUser.username,
                sent_at: new Date().toISOString()
            });

        if (error) console.error('Error sending DM:', error);
    };

    return {
        messages,
        channels,
        users, // Export users
        currentChannel,
        setCurrentChannel,
        recipient,
        setRecipient,
        currentUser,
        sendMessage,
        sendDirectMessage, // Export sendDM
        isLoading,
        messagesEndRef
    };
}
