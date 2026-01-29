'use client';

import { useState, useRef, useEffect } from 'react';
import { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
    users: {
        avatar_url: string | null;
        role: string | null;
    } | null;
};
type User = Database['public']['Tables']['users']['Row'];

interface SpacesChatAreaProps {
    currentChannel: Channel | null;
    messages: Message[];
    currentUser: User | null;
    sendMessage: (content: string) => Promise<void>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function SpacesChatArea({ currentChannel, messages, currentUser, sendMessage, messagesEndRef }: SpacesChatAreaProps) {
    const [inputValue, setInputValue] = useState('');

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        await sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Helper to format time
    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Check for Announcements restriction
    const isAnnouncement = currentChannel?.id === 'announcements';
    // Check if user is admin (or owner)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    const [showRestrictedModal, setShowRestrictedModal] = useState(false);

    const handleInputClick = () => {
        if (isAnnouncement && !isAdmin) {
            setShowRestrictedModal(true);
        }
    };

    return (
        <div className="flex-1 flex flex-col relative bg-gradient-to-b from-[#0c0c0c] to-[#110d1c]">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/10 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl text-slate-500">#</span>
                    <div>
                        <h2 className="font-heading text-lg font-bold text-white leading-tight">
                            {currentChannel?.name || 'Select a channel'}
                        </h2>
                        <p className="text-[10px] text-slate-400">{currentChannel?.description || ''}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Avatars omitted for now */}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col items-center justify-center text-center py-8 opacity-50">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                        <span className="material-icons-round text-2xl text-slate-600">tag</span>
                    </div>
                    <p className="text-slate-500 text-xs">Welcome to the start of #{currentChannel?.name || 'channel'}.</p>
                </div>

                {messages.map((msg, index) => {
                    const isCurrentUser = msg.user_id === currentUser?.id;
                    const avatar = msg.users?.avatar_url;

                    // Date Divider Logic
                    const currentDate = new Date(msg.sent_at || Date.now());
                    const outputDate = currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                    let showDivider = false;

                    if (index === 0) {
                        showDivider = true;
                    } else {
                        const prevDate = new Date(messages[index - 1].sent_at || Date.now());
                        if (currentDate.toDateString() !== prevDate.toDateString()) {
                            showDivider = true;
                        }
                    }

                    return (
                        <div key={msg.id}>
                            {showDivider && (
                                <div className="flex items-center justify-center my-6 gap-4">
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent flex-1 max-w-[12rem]"></div>
                                    <span className="px-3 py-0.5 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-medium text-slate-500/80 backdrop-blur-[1px] select-none">
                                        {outputDate}
                                    </span>
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent flex-1 max-w-[12rem]"></div>
                                </div>
                            )}

                            {isCurrentUser ? (
                                /* Current User Message (Right Aligned) */
                                <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse group">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mt-1 shrink-0 overflow-hidden">
                                        {avatar ? <img src={avatar} alt="Me" className="w-full h-full object-cover" /> : 'Me'}
                                    </div>
                                    <div className="space-y-1 flex flex-col items-end">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[10px] text-slate-500">{formatTime(msg.sent_at)}</span>
                                            <span className="font-heading font-bold text-sm text-white">{msg.username || 'You'}</span>
                                        </div>
                                        <div className="bg-violet-600 text-white p-3.5 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-[0_4px_20px_rgba(124,58,237,0.2)]">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Other User Message (Left Aligned) */
                                <div className="flex gap-4 max-w-3xl group">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white text-xs font-bold mt-1 shrink-0 overflow-hidden">
                                        {avatar ? <img src={avatar} alt={msg.username || 'User'} className="w-full h-full object-cover" /> : (msg.username?.[0] || 'U')}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-heading font-bold text-sm text-white cursor-pointer hover:underline">{msg.username}</span>
                                            {msg.users?.role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">{msg.users.role}</span>}
                                            <span className="text-[10px] text-slate-500">{formatTime(msg.sent_at)}</span>
                                        </div>
                                        <div className="bg-[#1a1a1a] border border-white/5 p-3.5 rounded-2xl rounded-tl-none text-slate-300 text-sm leading-relaxed shadow-sm hover:border-white/10 transition-colors">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 pt-2">
                <div
                    className={`bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 relative z-20 ${isAnnouncement && !isAdmin ? 'cursor-not-allowed opacity-70' : ''
                        }`}
                    onClick={handleInputClick}
                >
                    <button type="button" className="text-slate-400 hover:text-white transition-colors" disabled={isAnnouncement && !isAdmin}>
                        <span className="material-icons-round">add_circle</span>
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isAnnouncement && !isAdmin ? "Only admin can message !!" : `Message #${currentChannel?.name || 'channel'}...`}
                        className={`flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-sans ${isAnnouncement && !isAdmin ? 'cursor-not-allowed' : ''
                            }`}
                        disabled={isAnnouncement && !isAdmin}
                    />
                    <button className="text-slate-400 hover:text-white transition-colors" disabled={isAnnouncement && !isAdmin}>
                        <span className="material-icons-round">sentiment_satisfied</span>
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isAnnouncement && !isAdmin}
                        className="p-2 bg-white text-black rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <span className="material-icons-round text-lg">send</span>
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-600">
                        Press <span className="font-mono text-slate-500">Enter</span> to send
                    </p>
                </div>
            </div>

            {/* Restricted Access Modal */}
            {showRestrictedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <span className="material-icons-round text-2xl text-slate-400">lock</span>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-2">Restricted Access</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Only admins can post messages in the Announcements channel.
                            </p>

                            <button
                                onClick={() => setShowRestrictedModal(false)}
                                className="w-full py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            >
                                Okay, got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
