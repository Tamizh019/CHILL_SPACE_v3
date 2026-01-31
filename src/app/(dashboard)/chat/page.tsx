'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from './components/ChatSidebar';
import { SpacesChatArea } from './components/SpacesChatArea';
import { DirectMessagesArea } from './components/DirectMessagesArea';
import { FilesArea } from './components/FilesArea';

function ChatPageContent() {
    const [activeTab, setActiveTab] = useState<'spaces' | 'files' | 'dms'>('spaces');
    const [selectedFileChannelId, setSelectedFileChannelId] = useState<string | null>(null);
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
        } else if (activeTab === 'dms') {
            const user = users.find(u => u.id === id);
            if (user) setRecipient(user);
        }
    };

    // Handler to switch tabs and reset state
    const handleTabChange = (tab: 'spaces' | 'files' | 'dms') => {
        setActiveTab(tab);
        if (tab === 'spaces') {
            setRecipient(null); // Clear private chat when switching to spaces
        } else if (tab === 'files') {
            // Keep selectedFileChannelId as is
        }
    };

    // Handler for selecting file channel in Files tab
    const handleSelectFileChannel = (channelId: string | null) => {
        setSelectedFileChannelId(channelId);
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
                selectedFileChannelId={selectedFileChannelId}
                onSelectFileChannel={handleSelectFileChannel}
                currentUser={currentUser}
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
                    onChannelDeleted={() => {
                        // Switch to first available channel (General)
                        const generalChannel = channels.find(c => c.name === 'General' || c.id !== currentChannel?.id);
                        if (generalChannel) {
                            setCurrentChannel(generalChannel);
                        }
                    }}
                />
            ) : activeTab === 'files' ? (
                <FilesArea
                    selectedChannelId={selectedFileChannelId}
                    channels={channels}
                    currentUser={currentUser}
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

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="animate-pulse text-slate-500">Loading chat...</div>
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
