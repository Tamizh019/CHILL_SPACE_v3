'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
    users: {
        avatar_url: string | null;
        role: string | null;
    } | null;
};

interface DirectMessagesAreaProps {
    recipient: User | null;
    messages: Message[];
    currentUser: User | null;
    sendMessage: (content: string) => Promise<void>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    selectedChat?: null; // Legacy prop, can ignore or remove
}

export function DirectMessagesArea({ recipient, messages, currentUser, sendMessage, messagesEndRef }: DirectMessagesAreaProps) {
    const [inputValue, setInputValue] = useState('');
    const [showProfile, setShowProfile] = useState(false);

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

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, messagesEndRef]);

    // Auto-scroll to bottom
    // (useEffect logic is already added above)

    if (!recipient) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#0c0c0c] to-[#110d1c]">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 mx-auto">
                        <span className="material-icons-round text-3xl text-slate-600">chat</span>
                    </div>
                    <p className="text-slate-500 text-sm">Select a user to start chatting.</p>
                </div>
            </div>
        );
    }

    const displayName = recipient.username || recipient.email?.split('@')[0] || 'User';

    return (
        <div className="flex-1 flex overflow-hidden bg-gradient-to-b from-[#0c0c0c] to-[#110d1c]">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Chat Header */}
                <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {recipient.avatar_url ? (
                                <img src={recipient.avatar_url} alt={displayName} className="w-10 h-10 rounded-full border border-white/10" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {/* Online status optional */}
                        </div>
                        <div>
                            <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                                {displayName}
                            </h2>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                {recipient.role || 'User'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <button className="hover:text-white transition-colors"><span className="material-icons-round">phone</span></button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className={`transition-colors ${showProfile ? 'text-white' : 'hover:text-white'}`}
                        >
                            <span className="material-icons-round">more_horiz</span>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {messages.map((msg, index) => {
                        const isCurrentUser = msg.user_id === currentUser?.id;
                        const senderName = isCurrentUser ? 'You' : displayName;
                        const avatar = isCurrentUser ? currentUser?.avatar_url : recipient.avatar_url; // Use cached avatar or msg.users.avatar_url

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
                                    <div className="flex items-center justify-center my-8 gap-4">
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent flex-1 max-w-[12rem]"></div>
                                        <span className="px-3 py-0.5 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-medium text-slate-500/80 backdrop-blur-[1px] select-none">
                                            {outputDate}
                                        </span>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent flex-1 max-w-[12rem]"></div>
                                    </div>
                                )}

                                {isCurrentUser ? (
                                    /* Sent Message */
                                    <div className="flex gap-4 max-w-2xl ml-auto flex-row-reverse group">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mt-1 overflow-hidden">
                                            {avatar ? <img src={avatar} alt="Me" className="w-full h-full object-cover" /> : 'Me'}
                                        </div>
                                        <div className="space-y-2 flex flex-col items-end">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[10px] text-slate-500">{formatTime(msg.sent_at)}</span>
                                                <span className="font-heading font-bold text-sm text-white">You</span>
                                            </div>
                                            <div className="bg-violet-600 text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-[0_4px_20px_rgba(124,58,237,0.2)]">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Received Message */
                                    <div className="flex gap-4 max-w-2xl group">
                                        {avatar ? (
                                            <img src={avatar} alt={senderName} className="w-8 h-8 rounded-full mt-1" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold mt-1">
                                                {senderName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-heading font-bold text-sm text-white">{senderName}</span>
                                                <span className="text-[10px] text-slate-500">{formatTime(msg.sent_at)}</span>
                                            </div>
                                            <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl rounded-tl-none text-slate-300 text-sm leading-relaxed shadow-sm">
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

                {/* Input Area */}
                <div className="p-6 pt-2">
                    <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex items-end gap-2 relative">
                        <button className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                            <span className="material-icons-round">add_circle</span>
                        </button>
                        <div className="flex-1 py-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Message ${displayName}...`}
                                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                            />
                        </div>
                        <button className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                            <span className="material-icons-round">sentiment_satisfied</span>
                        </button>
                        <button
                            onClick={handleSend}
                            className="p-3 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                            <span className="material-icons-round">send</span>
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-600">Press <span className="font-mono text-slate-500">Enter</span> to send</p>
                    </div>
                </div>
            </div>

            {/* Right Panel: Details (Conditionally Rendered) */}
            {showProfile && (
                <div className="w-72 bg-black/20 border-l border-white/5 hidden xl:flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 flex flex-col items-center border-b border-white/5">
                        {recipient.avatar_url ? (
                            <img src={recipient.avatar_url} alt={displayName} className="w-24 h-24 rounded-full border-2 border-violet-500/30 p-1 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.15)]" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h2 className="font-heading text-xl font-bold text-white">{displayName}</h2>
                        {recipient.role && <p className="text-sm text-slate-400 mt-1">{recipient.role}</p>}
                    </div>

                    <div className="p-4 space-y-1">
                        {/* Placeholder actions */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                            <span className="text-sm text-slate-300 font-medium">Shared Media</span>
                            <span className="material-icons-round text-slate-500 group-hover:text-white text-sm">chevron_right</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
