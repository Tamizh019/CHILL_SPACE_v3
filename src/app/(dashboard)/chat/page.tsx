'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from './components/ChatSidebar';
import { SpacesChatArea } from './components/SpacesChatArea';
import { DirectMessagesArea } from './components/DirectMessagesArea';

export default function ChatPage() {
    const [activeTab, setActiveTab] = useState<'spaces' | 'dms'>('spaces');
    const searchParams = useSearchParams();
    const router = useRouter();
    const {
        channels, currentChannel, setCurrentChannel,
        users, recipient, setRecipient,
        messages, sendMessage, sendDirectMessage,
        currentUser, messagesEndRef, onlineUsers,
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
    } = useChat();

    // Deep Link Logic
    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId && users.length > 0) {
            const targetUser = users.find(u => u.id === userId);
            if (targetUser) {
                setRecipient(targetUser);
                setActiveTab('dms');
                // Clean up URL
                router.replace('/chat');
            }
        }
    }, [searchParams, users, setRecipient, router]);

    // Handler to switch channels based on ID
    const handleSelectChat = (id: string) => {
        if (activeTab === 'spaces') {
            const channel = channels.find(c => c.id === id);
            if (channel) setCurrentChannel(channel);
        } else {
            const user = users.find(u => u.id === id);
            if (user) setRecipient(user);
        }
    };

    // Handler to switch tabs and reset state
    const handleTabChange = (tab: 'spaces' | 'dms') => {
        setActiveTab(tab);
        if (tab === 'spaces') {
            setRecipient(null); // Clear private chat when switching to spaces
        }
    };

    return (
        <div className="flex-1 flex h-full overflow-hidden">
            <ChatSidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                selectedChat={activeTab === 'spaces' ? currentChannel?.id || null : recipient?.id || null}
                onSelectChat={handleSelectChat}
                channels={channels}
                users={users}
            />

            {activeTab === 'spaces' ? (
                <SpacesChatArea
                    currentChannel={currentChannel}
                    messages={messages}
                    currentUser={currentUser}
                    sendMessage={sendMessage}
                    messagesEndRef={messagesEndRef}
                    onlineUsers={onlineUsers}
                    users={users}
                    // New feature props
                    typingUsers={typingUsers}
                    broadcastTyping={broadcastTyping}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    pinnedMessages={pinnedMessages}
                    canDeleteMessage={canDeleteMessage}
                    deleteMessage={deleteMessage}
                    addReaction={addReaction}
                    removeReaction={removeReaction}
                    pinMessage={pinMessage}
                    unpinMessage={unpinMessage}
                    editMessage={editMessage}
                />
            ) : (
                <DirectMessagesArea
                    recipient={recipient}
                    messages={messages}
                    currentUser={currentUser}
                    sendMessage={sendDirectMessage}
                    messagesEndRef={messagesEndRef}
                />
            )}
        </div>
    );
}
