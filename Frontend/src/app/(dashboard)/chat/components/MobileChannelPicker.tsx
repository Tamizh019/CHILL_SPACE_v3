'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];

interface MobileChannelPickerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: 'spaces' | 'files' | 'dms';
    onTabChange: (tab: 'spaces' | 'files' | 'dms') => void;
    channels: Channel[];
    users: User[];
    currentChannelId: string | null;
    currentDmUserId: string | null;
    onSelectChannel: (id: string) => void;
    onSelectDm: (id: string) => void;
    unreadCounts?: Record<string, number>;
    unreadDmCounts?: Record<string, number>;
}

export function MobileChannelPicker({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    channels,
    users,
    currentChannelId,
    currentDmUserId,
    onSelectChannel,
    onSelectDm,
    unreadCounts = {},
    unreadDmCounts = {}
}: MobileChannelPickerProps) {
    const tabs = [
        { id: 'spaces' as const, label: 'Spaces', icon: 'tag' },
        { id: 'dms' as const, label: 'DMs', icon: 'chat' },
        { id: 'files' as const, label: 'Files', icon: 'folder' },
    ];

    const handleChannelSelect = (id: string) => {
        onSelectChannel(id);
        onClose();
    };

    const handleDmSelect = (id: string) => {
        onSelectDm(id);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0c] border-t border-white/10 rounded-t-3xl max-h-[70vh] overflow-hidden safe-area-pb"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="px-4 pb-3 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white text-center">Switch Channel</h2>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex gap-1 p-2 mx-4 mt-3 bg-white/5 rounded-xl">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <span className="material-icons-round text-base">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[50vh] p-4">
                            {activeTab === 'spaces' && (
                                <div className="space-y-1">
                                    {channels.map((channel) => {
                                        const isActive = channel.id === currentChannelId;
                                        const unread = unreadCounts[channel.id] || 0;
                                        return (
                                            <button
                                                key={channel.id}
                                                onClick={() => handleChannelSelect(channel.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                        ? 'bg-violet-500/20 border border-violet-500/30'
                                                        : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className={`text-lg ${isActive ? 'text-violet-400' : 'text-slate-500'}`}>#</span>
                                                <span className={`flex-1 text-left font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                                    {channel.name}
                                                </span>
                                                {unread > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-xs font-bold">
                                                        {unread}
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="material-icons-round text-violet-400 text-lg">check</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'dms' && (
                                <div className="space-y-1">
                                    {users.length === 0 ? (
                                        <p className="text-center text-slate-500 py-8">No users available</p>
                                    ) : (
                                        users.map((user) => {
                                            const isActive = user.id === currentDmUserId;
                                            const unread = unreadDmCounts[user.id] || 0;
                                            return (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleDmSelect(user.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                            ? 'bg-violet-500/20 border border-violet-500/30'
                                                            : 'hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            user.username?.[0]?.toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <span className={`flex-1 text-left font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                                        {user.username || 'Unknown'}
                                                    </span>
                                                    {unread > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-xs font-bold">
                                                            {unread}
                                                        </span>
                                                    )}
                                                    {isActive && (
                                                        <span className="material-icons-round text-violet-400 text-lg">check</span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {activeTab === 'files' && (
                                <div className="text-center py-8">
                                    <span className="material-icons-round text-4xl text-slate-600 mb-2">folder_open</span>
                                    <p className="text-slate-500">Browse files in the Files tab</p>
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
