'use client';

import { SpacesList } from './SpacesList';
import { DirectMessagesList } from './DirectMessagesList';
import { Database } from '@/types/supabase';
type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];

interface ChatSidebarProps {
    activeTab: 'spaces' | 'dms';
    onTabChange: (tab: 'spaces' | 'dms') => void;
    selectedChat: string | null;
    onSelectChat: (id: string) => void;
    channels: Channel[];
    users: User[];
}

export function ChatSidebar({ activeTab, onTabChange, selectedChat, onSelectChat, channels, users }: ChatSidebarProps) {
    return (
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
                <h1 className="font-heading text-2xl font-bold text-white mb-6">Chat</h1>

                {/* Toggle Switch */}
                <div className="p-1 rounded-xl bg-white/5 flex mb-4">
                    <button
                        onClick={() => onTabChange('spaces')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold font-heading transition-all ${activeTab === 'spaces'
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        Spaces
                    </button>
                    <button
                        onClick={() => onTabChange('dms')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold font-heading transition-all ${activeTab === 'dms'
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        Direct Messages
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                    <input
                        type="text"
                        placeholder={activeTab === 'spaces' ? 'Find a channel...' : 'Search messages...'}
                        className="w-full h-9 bg-black/20 border border-white/5 rounded-lg pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/30 transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1">
                {activeTab === 'spaces' ? (
                    <SpacesList selectedId={selectedChat} onSelect={onSelectChat} channels={channels} />
                ) : (
                    <DirectMessagesList selectedId={selectedChat} onSelect={onSelectChat} users={users} />
                )}
            </div>


        </div>
    );
}
