'use client';

import { useState, useEffect, useMemo } from 'react';
import { SpacesList } from './SpacesList';
import { DirectMessagesList } from './DirectMessagesList';
import { FilesList } from './FilesList';
import { CreateChannelModal } from './CreateChannelModal';
import { Database } from '@/types/supabase';
import { createClient } from '@/utils/supabase/client';

type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];

interface ChatSidebarProps {
    activeTab: 'spaces' | 'files' | 'dms';
    onTabChange: (tab: 'spaces' | 'files' | 'dms') => void;
    selectedChat: string | null;
    onSelectChat: (id: string) => void;
    channels: Channel[];
    users: User[];
    selectedFileChannelId?: string | null;
    onSelectFileChannel?: (channelId: string | null) => void;
    currentUser?: User | null;
}

const COMMUNITY_RULES = [
    { icon: '✅', text: 'Be respectful' },
    { icon: '✅', text: 'No inappropriate language' },
    { icon: '✅', text: 'No spam' },
    { icon: '✅', text: 'Help each other' },
    { icon: '✅', text: 'Use proper channels' },
];

export function ChatSidebar({
    activeTab,
    onTabChange,
    selectedChat,
    onSelectChat,
    channels,
    users,
    selectedFileChannelId,
    onSelectFileChannel,
    currentUser
}: ChatSidebarProps) {
    const [rulesExpanded, setRulesExpanded] = useState(false);
    const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Memoize supabase client to prevent recreation on every render
    const supabase = useMemo(() => createClient(), []);

    // Fetch file counts per channel
    useEffect(() => {
        async function fetchFileCounts() {
            const counts: Record<string, number> = {};
            for (const channel of channels) {
                const { count } = await supabase
                    .from('files')
                    .select('*', { count: 'exact', head: true })
                    .eq('channel_id', channel.id);
                counts[channel.id] = count || 0;
            }
            setFileCounts(counts);
        }
        if (channels.length > 0) {
            fetchFileCounts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channels]);

    return (
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
                <h1 className="font-heading text-2xl font-bold text-white mb-6">Chat & Files</h1>

                {/* Toggle Switch - 3 tabs */}
                <div className="p-1 rounded-xl bg-white/5 flex mb-4">
                    <button
                        onClick={() => onTabChange('spaces')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold font-heading transition-all flex items-center justify-center gap-1 ${activeTab === 'spaces'
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round text-xs">diversity_3</span>
                        Spaces
                    </button>
                    <button
                        onClick={() => onTabChange('files')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold font-heading transition-all flex items-center justify-center gap-1 ${activeTab === 'files'
                            ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round text-xs">folder</span>
                        Files
                    </button>
                    <button
                        onClick={() => onTabChange('dms')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold font-heading transition-all flex items-center justify-center gap-1 ${activeTab === 'dms'
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round text-xs">forum</span>
                        DMs
                    </button>
                </div>

                {/* Search - hide for files tab */}
                {activeTab !== 'files' && (
                    <div className="relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                        <input
                            type="text"
                            placeholder={activeTab === 'spaces' ? 'Find a channel...' : 'Search messages...'}
                            className="w-full h-9 bg-black/20 border border-white/5 rounded-lg pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/30 transition-colors"
                        />
                    </div>
                )}
            </div>

            {/* List */}
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1">
                {activeTab === 'spaces' && (
                    <>
                        {currentUser?.role && ['admin', 'moderator', 'owner'].includes(currentUser.role) && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-xl 
                                         bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 
                                         text-violet-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wide"
                            >
                                <span className="material-icons-round text-sm">add</span>
                                Create Channel
                            </button>
                        )}
                        <SpacesList selectedId={selectedChat} onSelect={onSelectChat} channels={channels} />
                    </>
                )}

                {activeTab === 'files' && (
                    <FilesList
                        selectedChannelId={selectedFileChannelId || null}
                        onSelectChannel={onSelectFileChannel || (() => { })}
                        channels={channels.filter(c => c.id !== 'announcements')}
                        fileCounts={fileCounts}
                    />
                )}

                {activeTab === 'dms' && (
                    <DirectMessagesList selectedId={selectedChat} onSelect={onSelectChat} users={users} />
                )}
            </div>

            {/* Create Channel Modal */}
            <CreateChannelModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onChannelCreated={() => {
                    setShowCreateModal(false);
                    // Channel list updates automatically via subscription in useChat
                }}
                currentUserId={currentUser?.id || ''}
            />

            {/* Community Rules - hide for files tab */}
            {activeTab !== 'files' && (
                <div className="border-t border-white/5 bg-black/10">
                    <button
                        onClick={() => setRulesExpanded(!rulesExpanded)}
                        className="w-full h-12 flex items-center justify-between px-4 hover:bg-white/5 transition-colors group"
                    >
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-sm">📜</span>
                            Community Rules
                        </h3>
                        <span className={`material-icons-round text-sm text-slate-500 group-hover:text-white transition-all duration-200 
                                          ${rulesExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {rulesExpanded && (
                        <div className="px-4 pb-4 space-y-2 animate-fade-in">
                            {COMMUNITY_RULES.map((rule, index) => (
                                <div key={index} className="flex items-center gap-2.5 text-xs">
                                    <span>{rule.icon}</span>
                                    <span className="text-slate-400">{rule.text}</span>
                                </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-white/5">
                                <p className="text-[10px] text-slate-600 text-center">
                                    Respect our community guidelines 💜
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
