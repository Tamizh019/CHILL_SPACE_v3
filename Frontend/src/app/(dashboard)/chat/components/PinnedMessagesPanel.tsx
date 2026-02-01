'use client';

import { Database } from '@/types/supabase';

type Message = Database['public']['Tables']['messages']['Row'] & {
    users: {
        avatar_url: string | null;
        role: string | null;
    } | null;
};

interface PinnedMessagesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    pinnedMessages: Message[];
    onUnpin: (messageId: string) => void;
    canUnpin: boolean;
}

export function PinnedMessagesPanel({
    isOpen,
    onClose,
    pinnedMessages,
    onUnpin,
    canUnpin
}: PinnedMessagesPanelProps) {
    if (!isOpen) return null;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#0c0c0c] border-l border-white/10 
                            z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-yellow-500">push_pin</span>
                        <h2 className="font-heading text-lg font-bold text-white">
                            Pinned Messages
                        </h2>
                        <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-slate-400">
                            {pinnedMessages.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {pinnedMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <span className="material-icons-round text-slate-600 text-2xl">push_pin</span>
                            </div>
                            <p className="text-slate-500 text-sm">No pinned messages</p>
                            <p className="text-slate-600 text-xs mt-1">
                                Pin important messages to find them easily
                            </p>
                        </div>
                    ) : (
                        pinnedMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className="p-3 bg-white/5 border border-white/5 rounded-xl 
                                           hover:bg-white/[0.07] transition-colors group"
                            >
                                {/* Author */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {msg.users?.avatar_url ? (
                                            <img
                                                src={msg.users.avatar_url}
                                                alt={msg.username || ''}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 
                                                            flex items-center justify-center text-[10px] font-bold text-white">
                                                {msg.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-white">
                                            {msg.username}
                                        </span>
                                    </div>

                                    {canUnpin && (
                                        <button
                                            onClick={() => onUnpin(msg.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 
                                                       text-slate-500 hover:text-red-400 transition-all"
                                            title="Unpin message"
                                        >
                                            <span className="material-icons-round text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <p className="text-sm text-slate-300 line-clamp-3">
                                    {msg.content}
                                </p>

                                {/* Date */}
                                <p className="text-[10px] text-slate-600 mt-2">
                                    Pinned on {formatDate(msg.pinned_at)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
