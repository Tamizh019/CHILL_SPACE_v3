import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';

// Extended Message type to include joined user data from queries
type Message = Database['public']['Tables']['messages']['Row'] & {
    users: {
        avatar_url: string | null;
        role: string | null;
    } | null;
    reactions?: { emoji: string; count: number; userIds: string[]; usernames: string[] }[];
    pinned_by?: string | null;
    pinned_by_username?: string | null;
    edited_at?: string | null;
};
type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];

import { useGlobalStore } from '@/context/GlobalStoreContext';

export function useChat() {
    const { user: globalUser, channels: globalChannels, friends: globalFriends, isLoading: isGlobalLoading } = useGlobalStore();

    // Local state for features specific to chat view
    const [messages, setMessages] = useState<Message[]>([]);
    // channels state is now derived from global store
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived State
    const currentUser = globalUser;
    const channels = globalChannels;
    const users = globalFriends; // Friends list used for DMs
    const [recipient, setRecipient] = useState<User | null>(null);

    // State for Online Users (Presence)
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

    // State for Typing Indicators
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State for Reply
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // State for Pinned Messages
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);

    // 1. Initialize Default Channel (Once Global Data is Ready)
    useEffect(() => {
        if (!currentChannel && channels.length > 0 && !isLoading) {
            const general = channels.find(c => c.name === 'General');
            setCurrentChannel(general || channels[0]);
            setIsLoading(false);
        }
    }, [channels, currentChannel, isLoading]);

    // 2. Channel & User Fetching replaced by GlobalStore
    // Removed local fetchChannels and User fetching effects


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
                setIsLoading(false);
                return;
            }

            // Fetch reactions for all messages
            const messageIds = data.map((m: any) => m.id);
            const { data: reactionsData } = await supabase
                .from('message_reactions')
                .select('*, users:user_id (username)')
                .in('message_id', messageIds);

            // Group reactions by message and emoji
            const reactionsMap: { [key: string]: any[] } = {};
            if (reactionsData) {
                reactionsData.forEach((r: any) => {
                    const key = r.message_id;
                    if (!reactionsMap[key]) reactionsMap[key] = [];

                    const existing = reactionsMap[key].find((x: any) => x.emoji === r.emoji);
                    if (existing) {
                        existing.count++;
                        existing.userIds.push(r.user_id);
                        existing.usernames.push(r.users?.username || 'Unknown');
                    } else {
                        reactionsMap[key].push({
                            emoji: r.emoji,
                            count: 1,
                            userIds: [r.user_id],
                            usernames: [r.users?.username || 'Unknown']
                        });
                    }
                });
            }

            // Merge reactions into messages
            const messagesWithReactions = data.map((m: any) => ({
                ...m,
                reactions: reactionsMap[m.id] || []
            }));

            setMessages(messagesWithReactions as any);
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

            // Avoid duplicates
            setMessages(prev => {
                // Check if already exists by real ID
                if (prev.find(m => m.id === newMsg.id)) return prev;

                // Check if this is a real-time update for an optimistic message (temp-xxx)
                // Match by content + user + close timestamp
                const existingOptimistic = prev.find(m =>
                    m.id.startsWith('temp-') &&
                    m.content === newMsg.content &&
                    m.user_id === newMsg.user_id &&
                    Math.abs(new Date(m.sent_at || 0).getTime() - new Date(newMsg.sent_at || 0).getTime()) < 10000
                );

                if (existingOptimistic) {
                    // Replace the optimistic message with the real one
                    return prev.map(m => m.id === existingOptimistic.id ? { ...newMsg } : m) as any;
                }

                // New message - add it
                return [...prev, newMsg as any];
            });

            // Only fetch user details if we have a valid user_id
            if (newMsg.user_id) {
                const { data: sender } = await supabase
                    .from('users')
                    .select('avatar_url, role')
                    .eq('id', newMsg.user_id)
                    .single();

                setMessages(prev => prev.map(msg =>
                    msg.id === newMsg.id ? { ...msg, users: sender } : msg
                ) as any);
            }
        };

        messageSubscription.subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [currentChannel, recipient]);

    // 5. Send Message Function (with reply support)
    const sendMessage = async (content: string, replyToId?: string) => {
        if (!currentChannel || !currentUser || !content.trim()) return;

        // Handle Announcements
        if (currentChannel.id === 'announcements') {
            const { error } = await supabase
                .from('global_alerts')
                .insert({
                    message: content,
                    type: 'info',
                    is_active: true
                } as any);

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
                sent_at: new Date().toISOString(),
                reply_to_id: replyToId || null
            } as any);

        if (error) {
            console.error('Error sending message:', error);
        } else {
            // Optimistic update - add message immediately to local state
            // Real-time subscription will also fire, but we deduplicate in handleNewMessage
            const optimisticMsg: any = {
                id: `temp-${Date.now()}`, // Temporary ID until real-time updates with real ID
                content,
                channel_id: currentChannel.id,
                user_id: currentUser.id,
                username: currentUser.username,
                sent_at: new Date().toISOString(),
                reply_to_id: replyToId || null,
                users: {
                    avatar_url: currentUser.avatar_url,
                    role: currentUser.role
                }
            };
            setMessages(prev => {
                // Avoid adding if realtime already added it
                if (prev.find(m => m.content === content && m.user_id === currentUser.id &&
                    Math.abs(new Date(m.sent_at || 0).getTime() - Date.now()) < 2000)) {
                    return prev;
                }
                return [...prev, optimisticMsg];
            });
        }
    };

    // State moved to top
    // ... Existing useEffects ...

    // ... Existing useEffects ...

    // 6. User Fetching replaced by GlobalStore
    // Removed local fetchUsers effect

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
            } as any);

        if (error) console.error('Error sending DM:', error);
    };

    // 8. Presence Tracking (Online Users)
    useEffect(() => {
        if (!currentUser) return;

        const presenceChannel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        // Track presence state and sync to onlineUsers
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const onlineUserIds = Object.keys(state);

                // Fetch user details for all online users
                if (onlineUserIds.length > 0) {
                    supabase
                        .from('users')
                        .select('*')
                        .in('id', onlineUserIds)
                        .then(({ data }) => {
                            if (data) setOnlineUsers(data);
                        });
                } else {
                    setOnlineUsers([]);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track this user as online
                    await presenceChannel.track({
                        user_id: currentUser.id,
                        username: currentUser.username,
                        online_at: new Date().toISOString(),
                    });

                    // Update online_members table
                    await supabase.from('online_members').upsert({
                        user_id: currentUser.id,
                        username: currentUser.username,
                        is_online: true,
                        last_seen: new Date().toISOString(),
                    } as any);
                }
            });

        // Cleanup: Mark user as offline when leaving
        return () => {
            (supabase.from('online_members') as any).update({
                is_online: false,
                last_seen: new Date().toISOString(),
            }).eq('user_id', currentUser.id).then(() => {
                supabase.removeChannel(presenceChannel);
            });
        };
    }, [currentUser]);

    // 9. Typing Indicator Functions
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Subscribe to typing events
    useEffect(() => {
        if (!currentChannel || recipient) return;

        const channelName = `typing:${currentChannel.id}`;
        const typingChannel = supabase.channel(channelName)
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId !== currentUser?.id) {
                    setTypingUsers(prev => {
                        if (!prev.includes(payload.username)) {
                            return [...prev, payload.username];
                        }
                        return prev;
                    });

                    // Auto-remove after 3 seconds if no stop event
                    setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u !== payload.username));
                    }, 3000);
                }
            })
            .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
                setTypingUsers(prev => prev.filter(u => u !== payload.username));
            })
            .subscribe();

        typingChannelRef.current = typingChannel;

        return () => {
            supabase.removeChannel(typingChannel);
            typingChannelRef.current = null;
            setTypingUsers([]);
        };
    }, [currentChannel, recipient, currentUser?.id]);

    const broadcastTyping = useCallback(() => {
        if (!typingChannelRef.current || !currentUser) return;

        typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { username: currentUser.username, userId: currentUser.id }
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
            if (typingChannelRef.current) {
                typingChannelRef.current.send({
                    type: 'broadcast',
                    event: 'stop_typing',
                    payload: { userId: currentUser.id, username: currentUser.username }
                });
            }
        }, 2000);
    }, [currentUser]);

    // 10. Role-Based Message Deletion
    const canDeleteMessage = useCallback((messageUserId: string, messageAuthorRole: string | null) => {
        if (!currentUser) return false;

        const roleHierarchy: { [key: string]: number } = { admin: 3, moderator: 2, user: 1 };
        const currentRole = roleHierarchy[currentUser.role || 'user'] || 1;
        const authorRole = roleHierarchy[messageAuthorRole || 'user'] || 1;

        // Admin: can delete anyone's messages
        if (currentUser.role === 'admin') return true;

        // Moderator: can delete user messages only (not admin)
        if (currentUser.role === 'moderator' && authorRole < 2) return true;

        // User: can only delete own messages
        return messageUserId === currentUser.id;
    }, [currentUser]);

    const deleteMessage = async (messageId: string) => {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('Error deleting message:', error);
            return false;
        }

        // Optimistic update
        setMessages(prev => prev.filter(m => m.id !== messageId));
        return true;
    };

    // 11. Message Reactions - Toggle behavior (add if not reacted, remove if already reacted)
    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!currentUser) return;

        // Check if user already reacted with this emoji
        const message = messages.find(m => m.id === messageId);
        const reactions = (message as any)?.reactions || [];
        const existingReaction = reactions.find((r: any) => r.emoji === emoji);
        const hasReacted = existingReaction?.userIds?.includes(currentUser.id);

        if (hasReacted) {
            // Remove reaction
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    const currentReactions = (m as any).reactions || [];
                    return {
                        ...m,
                        reactions: currentReactions
                            .map((r: any) =>
                                r.emoji === emoji
                                    ? {
                                        ...r,
                                        count: r.count - 1,
                                        userIds: r.userIds.filter((id: string) => id !== currentUser.id),
                                        usernames: r.usernames?.filter((_: string, i: number) => r.userIds[i] !== currentUser.id) || []
                                    }
                                    : r
                            )
                            .filter((r: any) => r.count > 0)
                    };
                }
                return m;
            }));

            await supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', currentUser.id)
                .eq('emoji', emoji);
        } else {
            // Add reaction
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    const currentReactions = (m as any).reactions || [];
                    const existing = currentReactions.find((r: any) => r.emoji === emoji);

                    if (existing) {
                        return {
                            ...m,
                            reactions: currentReactions.map((r: any) =>
                                r.emoji === emoji
                                    ? {
                                        ...r,
                                        count: r.count + 1,
                                        userIds: [...r.userIds, currentUser.id],
                                        usernames: [...(r.usernames || []), currentUser.username]
                                    }
                                    : r
                            )
                        };
                    } else {
                        return {
                            ...m,
                            reactions: [...currentReactions, {
                                emoji,
                                count: 1,
                                userIds: [currentUser.id],
                                usernames: [currentUser.username]
                            }]
                        };
                    }
                }
                return m;
            }));

            const { error } = await supabase
                .from('message_reactions')
                .insert({
                    message_id: messageId,
                    user_id: currentUser.id,
                    emoji
                } as any);

            if (error && error.code !== '23505') {
                console.error('Error adding reaction:', error);
            }
        }
    };

    // Keep old functions for compatibility but they now just call toggle
    const addReaction = async (messageId: string, emoji: string) => toggleReaction(messageId, emoji);
    const removeReaction = async (messageId: string, emoji: string) => toggleReaction(messageId, emoji);

    // 12. Pin/Unpin Messages
    const pinMessage = async (messageId: string) => {
        if (!currentUser) {
            console.log('[PIN] No current user');
            return false;
        }

        console.log('[PIN] Pinning message:', messageId);

        const { error } = await (supabase
            .from('messages') as any)
            .update({
                pinned: true,
                pinned_at: new Date().toISOString(),
                pinned_by: currentUser.id,
                pinned_by_username: currentUser.username
            })
            .eq('id', messageId);

        if (error) {
            console.error('[PIN] Error pinning message:', error);
            return false;
        }

        console.log('[PIN] Successfully pinned in database');

        // Update local messages state
        const pinnedMessage = messages.find(m => m.id === messageId);
        setMessages(prev => prev.map(m =>
            m.id === messageId
                ? { ...m, pinned: true, pinned_at: new Date().toISOString(), pinned_by: currentUser.id, pinned_by_username: currentUser.username }
                : m
        ));

        // Also update pinnedMessages array
        if (pinnedMessage) {
            const updated = {
                ...pinnedMessage,
                pinned: true,
                pinned_at: new Date().toISOString(),
                pinned_by: currentUser.id,
                pinned_by_username: currentUser.username
            };
            setPinnedMessages(prev => [updated as Message, ...prev]);
            console.log('[PIN] Updated local pinnedMessages array');
        }

        return true;
    };

    const unpinMessage = async (messageId: string) => {
        const { error } = await (supabase
            .from('messages') as any)
            .update({
                pinned: false,
                pinned_at: null,
                pinned_by: null,
                pinned_by_username: null
            })
            .eq('id', messageId);

        if (error) {
            console.error('Error unpinning message:', error);
            return false;
        }

        setMessages(prev => prev.map(m =>
            m.id === messageId
                ? { ...m, pinned: false, pinned_at: null, pinned_by: null, pinned_by_username: null }
                : m
        ));
        setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
        return true;
    };

    // Fetch pinned messages for current channel
    useEffect(() => {
        if (!currentChannel || currentChannel.id === 'announcements') {
            setPinnedMessages([]);
            return;
        }

        const fetchPinned = async () => {
            const { data } = await supabase
                .from('messages')
                .select(`*, users:user_id ( avatar_url, role )`)
                .eq('channel_id', currentChannel.id)
                .eq('pinned', true)
                .order('pinned_at', { ascending: false });

            if (data) {
                setPinnedMessages(data as Message[]);
            }
        };

        fetchPinned();
    }, [currentChannel]);

    // 13. Edit Message
    const editMessage = async (messageId: string, newContent: string) => {
        const { error } = await (supabase
            .from('messages') as any)
            .update({
                content: newContent,
                edited_at: new Date().toISOString()
            })
            .eq('id', messageId);

        if (error) {
            console.error('[EDIT] Error editing message:', error);
            return false;
        }

        // Update local state
        setMessages(prev => prev.map(m =>
            m.id === messageId
                ? { ...m, content: newContent, edited_at: new Date().toISOString() }
                : m
        ));
        return true;
    };

    return {
        messages,
        channels,
        users,
        onlineUsers,
        currentChannel,
        setCurrentChannel,
        recipient,
        setRecipient,
        currentUser,
        sendMessage,
        sendDirectMessage,
        isLoading,
        messagesEndRef,
        // New features
        typingUsers,
        broadcastTyping,
        replyingTo,
        setReplyingTo,
        pinnedMessages,
        canDeleteMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        pinMessage,
        unpinMessage,
        editMessage
    };
}
