'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from './components/ChatSidebar';
import { SpacesChatArea } from './components/SpacesChatArea';
import { DirectMessagesArea } from './components/DirectMessagesArea';
import { FilesArea } from './components/FilesArea';
import { MobileChannelPicker } from './components/MobileChannelPicker';

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
        editMessage,
        unreadCounts,
        unreadDmCounts
    } = useChat();

    // State for URL synchronization
    const [isUrlSyncing, setIsUrlSyncing] = useState(true);

    // 1. Initial Load: Restore state from URL
    useEffect(() => {
        if (!isUrlSyncing) return;

        // Wait for data to be available
        if (channels.length === 0) return;

        const tab = searchParams.get('tab') as 'spaces' | 'files' | 'dms' | null;
        const channelId = searchParams.get('channelId');
        const userId = searchParams.get('userId');
        const fileChannelId = searchParams.get('fileChannelId');

        // Restore Tab
        if (tab && ['spaces', 'files', 'dms'].includes(tab)) {
            setActiveTab(tab);
        }

        // Restore Channel (Spaces)
        if (tab === 'spaces' || !tab) { // Default to spaces
            if (channelId) {
                const targetChannel = channels.find(c => c.id === channelId);
                if (targetChannel) {
                    setCurrentChannel(targetChannel);
                }
            } else {
                // Force default to General if no ID provided in URL
                const general = channels.find(c => c.name === 'General');
                if (general) setCurrentChannel(general);
            }
        }

        // Restore DM (Direct Messages)
        if (tab === 'dms' && userId && users.length > 0) {
            const targetUser = users.find(u => u.id === userId);
            if (targetUser) {
                setRecipient(targetUser);
            }
        }

        // Restore File Channel (Files)
        if (tab === 'files') {
            if (fileChannelId) {
                setSelectedFileChannelId(fileChannelId);
            }
        }

        // Mark initial sync as done to allow updates to push to URL
        setIsUrlSyncing(false);
    }, [searchParams, channels, users, isUrlSyncing]);

    // 2. Sync State changes to URL
    useEffect(() => {
        if (isUrlSyncing) return; // Don't push to URL while restoring

        const params = new URLSearchParams();

        // Active Tab
        params.set('tab', activeTab);

        // Context based on tab
        if (activeTab === 'spaces' && currentChannel) {
            params.set('channelId', currentChannel.id);
        } else if (activeTab === 'dms' && recipient) {
            params.set('userId', recipient.id);
        } else if (activeTab === 'files' && selectedFileChannelId) {
            params.set('fileChannelId', selectedFileChannelId);
        }

        // Deep link handling removal - we just replace with current state
        router.replace(`/chat?${params.toString()}`, { scroll: false });

    }, [activeTab, currentChannel, recipient, selectedFileChannelId, router, isUrlSyncing]);

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
            // Always satisfy "show all files first" requirement
            setSelectedFileChannelId(null);
        }
    };

    // Handler for selecting file channel in Files tab
    const handleSelectFileChannel = (channelId: string | null) => {
        setSelectedFileChannelId(channelId);
    };

    // Mobile channel picker state
    const [showMobilePicker, setShowMobilePicker] = useState(false);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Mobile Header - Channel Picker Trigger */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <button
                    onClick={() => setShowMobilePicker(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                    <span className="text-violet-400 text-lg">#</span>
                    <span className="text-white font-medium text-sm truncate max-w-[150px]">
                        {activeTab === 'spaces'
                            ? currentChannel?.name || 'Select Channel'
                            : activeTab === 'dms'
                                ? recipient?.username || 'Select User'
                                : 'Files'
                        }
                    </span>
                    <span className="material-icons-round text-slate-400 text-base">expand_more</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{onlineUsers.length} online</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
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
                    unreadCounts={unreadCounts}
                    unreadDmCounts={unreadDmCounts}
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
                        onSwitchToFiles={() => {
                            setActiveTab('files');
                            // Set the file channel to current channel
                            if (currentChannel) {
                                setSelectedFileChannelId(currentChannel.id);
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

            {/* Mobile Channel Picker */}
            <MobileChannelPicker
                isOpen={showMobilePicker}
                onClose={() => setShowMobilePicker(false)}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                channels={channels}
                users={users}
                currentChannelId={currentChannel?.id || null}
                currentDmUserId={recipient?.id || null}
                onSelectChannel={(id) => {
                    const channel = channels.find(c => c.id === id);
                    if (channel) setCurrentChannel(channel);
                    setActiveTab('spaces');
                }}
                onSelectDm={(id) => {
                    const user = users.find(u => u.id === id);
                    if (user) setRecipient(user);
                    setActiveTab('dms');
                }}
                unreadCounts={unreadCounts}
                unreadDmCounts={unreadDmCounts}
            />
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
