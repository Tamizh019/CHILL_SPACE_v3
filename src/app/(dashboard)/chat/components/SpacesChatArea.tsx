'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Database } from '@/types/supabase';
import { OnlineUsersList } from './OnlineUsersList';
import { TypingIndicator } from './TypingIndicator';
import { JumpToLatest } from './JumpToLatest';
import { LinkPreview, extractUrls } from './LinkPreview';
import { PinnedMessagesPanel } from './PinnedMessagesPanel';
import { UniversalModal } from '@/components/ui/UniversalModal';
import { ChatDemoModal } from './ChatDemoModal';
import { ChannelSettingsModal } from './ChannelSettingsModal';
import { useFiles, FileRecord } from '@/hooks/useFiles';
import { getFileTypeInfo } from '@/utils/fileUtils';
import { MarkdownComposerModal } from './MarkdownComposerModal';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FilePreviewPanel } from './FilePreviewPanel';

type Channel = Database['public']['Tables']['channels']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
    users: {
        avatar_url: string | null;
        role: string | null;
    } | null;
    reactions?: { emoji: string; count: number; userIds: string[]; usernames: string[] }[];
    pinned_by?: string | null;
    pinned_by_username?: string | null;
    edited_at?: string | null;
    reply_to_id?: string | null;
    is_markdown?: boolean | null;
};
type User = Database['public']['Tables']['users']['Row'];

interface SpacesChatAreaProps {
    currentChannel: Channel | null;
    messages: Message[];
    currentUser: User | null;
    sendMessage: (content: string, replyToId?: string) => Promise<void>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onlineUsers: User[];
    users: User[];
    typingUsers: string[];
    broadcastTyping: () => void;
    replyingTo: Message | null;
    setReplyingTo: (msg: Message | null) => void;
    pinnedMessages: Message[];
    canDeleteMessage: (userId: string, role: string | null) => boolean;
    deleteMessage: (id: string) => Promise<boolean>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    removeReaction: (messageId: string, emoji: string) => Promise<void>;
    pinMessage: (id: string) => Promise<boolean | undefined>;
    unpinMessage: (id: string) => Promise<boolean>;
    editMessage: (id: string, content: string) => Promise<boolean>;
    onChannelDeleted?: () => void;
    onSwitchToFiles?: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥'];
const CODE_BLOCK_REGEX = /```(\w+)?\n?([\s\S]*?)```/g;
const INLINE_CODE_REGEX = /`([^`]+)`/g;
const MENTION_REGEX = /@(\w+)/g;

export function SpacesChatArea({
    currentChannel,
    messages,
    currentUser,
    sendMessage,
    messagesEndRef,
    onlineUsers,
    users,
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
    onChannelDeleted,
    onSwitchToFiles
}: SpacesChatAreaProps) {
    const [inputValue, setInputValue] = useState('');
    const [showPinnedPanel, setShowPinnedPanel] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
    const [showJumpButton, setShowJumpButton] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [viewingReaction, setViewingReaction] = useState<{ emoji: string; count: number; usernames: string[] } | null>(null);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [mentionTab, setMentionTab] = useState<'members' | 'files'>('members');
    const [activeFileMention, setActiveFileMention] = useState<FileRecord | null>(null);
    const [showMarkdownComposer, setShowMarkdownComposer] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Fetch files for current channel (for @ mentions)
    const { files: channelFiles, getFileUrl } = useFiles(currentChannel?.id !== 'announcements' ? currentChannel?.id : undefined);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isNearBottomRef = useRef(true);
    const prevMessageCountRef = useRef(messages.length);

    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const threshold = 100;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        isNearBottomRef.current = isNearBottom;
        setShowJumpButton(!isNearBottom);
        if (isNearBottom) setNewMessageCount(0);
    }, []);

    useEffect(() => {
        if (!isNearBottomRef.current && messages.length > prevMessageCountRef.current) {
            setNewMessageCount(prev => prev + (messages.length - prevMessageCountRef.current));
        }
        prevMessageCountRef.current = messages.length;
    }, [messages.length]);

    useEffect(() => {
        if (isNearBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, messagesEndRef]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowJumpButton(false);
        setNewMessageCount(0);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        if (editingMessage) {
            // Edit existing message
            const success = await editMessage(editingMessage.id, inputValue);
            if (success) {
                setInputValue('');
                setEditingMessage(null);
            }
        } else {
            // Send new message (with reply if applicable)
            await sendMessage(inputValue, replyingTo?.id);
            setInputValue('');
            setReplyingTo(null);
            scrollToBottom();
        }
    };

    const handleMarkdownSend = async (markdownContent: string) => {
        // For now, we'll send markdown as regular message with a prefix
        // In production, you'd want to add is_markdown flag to database
        await sendMessage(`[MD]\n${markdownContent}`, replyingTo?.id);
        setReplyingTo(null);
        scrollToBottom();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === 'Escape') {
            setShowMentionDropdown(false);
            setActiveMessageMenu(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        broadcastTyping();

        const cursorPos = e.target.selectionStart || 0;
        const textBeforeCursor = value.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            if (!textAfterAt.includes(' ')) {
                setMentionFilter(textAfterAt.toLowerCase());
                setMentionStartIndex(lastAtIndex);
                setShowMentionDropdown(true);
                return;
            }
        }
        setShowMentionDropdown(false);
    };

    const insertMention = (username: string) => {
        const before = inputValue.slice(0, mentionStartIndex);
        const after = inputValue.slice(inputRef.current?.selectionStart || inputValue.length);
        setInputValue(`${before}@${username} ${after}`);
        setShowMentionDropdown(false);
        inputRef.current?.focus();
    };

    const insertFileMention = (file: FileRecord) => {
        const before = inputValue.slice(0, mentionStartIndex);
        const after = inputValue.slice(inputRef.current?.selectionStart || inputValue.length);
        // Use format @[filename:fileId] for file mentions
        const fileName = file.display_name || file.original_filename;
        setInputValue(`${before}@${fileName} ${after}`);
        setShowMentionDropdown(false);
        inputRef.current?.focus();
    };

    const filteredMentionUsers = users.filter(u =>
        u.username?.toLowerCase().includes(mentionFilter) && u.id !== currentUser?.id
    ).slice(0, 5);

    // Filter files for @ mention dropdown
    const filteredMentionFiles = channelFiles.filter(f =>
    (f.display_name?.toLowerCase().includes(mentionFilter) ||
        f.original_filename?.toLowerCase().includes(mentionFilter))
    ).slice(0, 5);

    // Check if there are any matches in either category
    const hasMentionMatches = filteredMentionUsers.length > 0 || filteredMentionFiles.length > 0;

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Render message content with code blocks and mentions
    const renderMessageContent = (content: string) => {
        if (!content) return null;

        // Handle code blocks first
        let processedContent = content;
        const codeBlocks: { placeholder: string; lang: string; code: string }[] = [];

        processedContent = processedContent.replace(CODE_BLOCK_REGEX, (_, lang, code) => {
            const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
            codeBlocks.push({ placeholder, lang: lang || 'text', code: code.trim() });
            return placeholder;
        });

        // Split by code block placeholders
        const segments = processedContent.split(/(__CODEBLOCK_\d+__)/);

        return segments.map((segment, index) => {
            // Check if this is a code block
            const codeBlock = codeBlocks.find(cb => cb.placeholder === segment);
            if (codeBlock) {
                return (
                    <pre key={index} className="my-2 p-3 rounded-lg bg-black/50 border border-white/10 overflow-x-auto">
                        <code className="text-xs font-mono text-emerald-400">{codeBlock.code}</code>
                    </pre>
                );
            }

            // Process inline code
            const inlineParts = segment.split(INLINE_CODE_REGEX);
            return (
                <span key={index}>
                    {inlineParts.map((part, i) => {
                        if (i % 2 === 1) {
                            return (
                                <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-white/10 text-violet-300 text-xs font-mono">
                                    {part}
                                </code>
                            );
                        }

                        // Process file mentions first - look for @filename patterns
                        // Check if any file name exists in this part prefixed with @
                        let processedPart = part;
                        const fileElements: { start: number; end: number; file: FileRecord; originalText: string }[] = [];

                        // Find all file mentions
                        for (const file of channelFiles) {
                            const fileName = file.display_name || file.original_filename;
                            const mentionPattern = `@${fileName}`;
                            const lowerPart = processedPart.toLowerCase();
                            const lowerMention = mentionPattern.toLowerCase();

                            let searchIndex = 0;
                            while (true) {
                                const idx = lowerPart.indexOf(lowerMention, searchIndex);
                                if (idx === -1) break;

                                // Check this doesn't overlap with existing matches
                                const overlaps = fileElements.some(
                                    fe => (idx >= fe.start && idx < fe.end) || (idx + mentionPattern.length > fe.start && idx + mentionPattern.length <= fe.end)
                                );

                                if (!overlaps) {
                                    fileElements.push({
                                        start: idx,
                                        end: idx + mentionPattern.length,
                                        file: file,
                                        originalText: processedPart.substring(idx, idx + mentionPattern.length)
                                    });
                                }
                                searchIndex = idx + 1;
                            }
                        }

                        // Sort by position
                        fileElements.sort((a, b) => a.start - b.start);

                        // If no file mentions, process regular mentions
                        if (fileElements.length === 0) {
                            const mentionParts = part.split(MENTION_REGEX);
                            return mentionParts.map((mp, j) => {
                                if (j % 2 === 1) {
                                    // Regular user mention
                                    return (
                                        <span key={j} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-violet-500/40 text-violet-200 font-medium border border-violet-400/20">
                                            @{mp}
                                        </span>
                                    );
                                }
                                return mp;
                            });
                        }

                        // Build the result with file mentions
                        const result: React.ReactNode[] = [];
                        let lastEnd = 0;

                        fileElements.forEach((fe, idx) => {
                            // Add text before this mention
                            if (fe.start > lastEnd) {
                                const textBefore = part.substring(lastEnd, fe.start);
                                // Process user mentions in text before
                                const mentionParts = textBefore.split(MENTION_REGEX);
                                mentionParts.forEach((mp, j) => {
                                    if (j % 2 === 1) {
                                        result.push(
                                            <span key={`before-${idx}-${j}`} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-violet-500/40 text-violet-200 font-medium border border-violet-400/20">
                                                @{mp}
                                            </span>
                                        );
                                    } else if (mp) {
                                        result.push(mp);
                                    }
                                });
                            }

                            // Add the file mention
                            const fileTypeInfo = getFileTypeInfo(fe.file.file_type);
                            result.push(
                                <span
                                    key={`file-${idx}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveFileMention(activeFileMention?.id === fe.file.id ? null : fe.file);
                                    }}
                                    className="relative inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-200 font-medium border border-violet-400/30 cursor-pointer hover:from-violet-500/30 hover:to-purple-500/30 hover:border-violet-400/50 transition-all shadow-sm shadow-violet-500/10"
                                    title={`📎 ${fe.file.display_name || fe.file.original_filename} - Click to view`}
                                >
                                    <span className={`material-icons-round text-base ${fileTypeInfo.color}`}>
                                        {fileTypeInfo.icon}
                                    </span>
                                    <span className="material-icons-round text-xs text-violet-300/70">expand_more</span>
                                </span>
                            );

                            lastEnd = fe.end;
                        });

                        // Add remaining text after last mention
                        if (lastEnd < part.length) {
                            const textAfter = part.substring(lastEnd);
                            const mentionParts = textAfter.split(MENTION_REGEX);
                            mentionParts.forEach((mp, j) => {
                                if (j % 2 === 1) {
                                    result.push(
                                        <span key={`after-${j}`} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-violet-500/40 text-violet-200 font-medium border border-violet-400/20">
                                            @{mp}
                                        </span>
                                    );
                                } else if (mp) {
                                    result.push(mp);
                                }
                            });
                        }

                        return result;
                    })}
                </span>
            );
        });
    };

    // Check if messages should be grouped (same user within 2 minutes)
    const shouldGroupWithPrevious = (currentMsg: Message, prevMsg: Message | null) => {
        if (!prevMsg) return false;
        if (currentMsg.user_id !== prevMsg.user_id) return false;
        const currentTime = new Date(currentMsg.sent_at || 0).getTime();
        const prevTime = new Date(prevMsg.sent_at || 0).getTime();
        return (currentTime - prevTime) < 2 * 60 * 1000;
    };

    const isAnnouncement = currentChannel?.id === 'announcements';
    const isAdmin = currentUser?.role === 'admin';
    const isModerator = currentUser?.role === 'moderator';
    const canPin = isAdmin || isModerator;

    const [showRestrictedModal, setShowRestrictedModal] = useState(false);

    const handleDeleteClick = async (messageId: string) => {
        const success = await deleteMessage(messageId);
        if (success) setDeleteConfirmId(null);
    };

    // Close menu when clicking outside - with proper check
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-message-menu]')) {
                setActiveMessageMenu(null);
            }
            // Close add menu when clicking outside
            if (!target.closest('[data-add-menu]') && !target.closest('[data-add-button]')) {
                setShowAddMenu(false);
            }
        };
        if (activeMessageMenu || showAddMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeMessageMenu, showAddMenu]);

    return (
        <div className="flex-1 flex overflow-hidden">
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
                    <div className="flex items-center gap-2">
                        {/* Settings Button - Only for admins/mods and non-system channels */}
                        {canPin && currentChannel && currentChannel.id !== 'announcements' && (
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-violet-500/20 hover:border-violet-500/30 hover:text-violet-400 transition-all"
                                title="Channel Settings"
                            >
                                <span className="material-icons-round text-lg">settings</span>
                            </button>
                        )}
                        {/* Help Button */}
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-violet-500/20 hover:border-violet-500/30 hover:text-violet-400 transition-all"
                            title="How to use chat"
                        >
                            <span className="material-icons-round text-lg">help_outline</span>
                        </button>
                        {/* Pinned Messages Button */}
                        <button
                            onClick={() => setShowPinnedPanel(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all
                                ${pinnedMessages.length > 0
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="material-icons-round text-sm">push_pin</span>
                            <span className="text-xs font-medium">{pinnedMessages.length || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
                >
                    <div className="flex flex-col items-center justify-center text-center py-8 opacity-50">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                            <span className="material-icons-round text-2xl text-slate-600">tag</span>
                        </div>
                        <p className="text-slate-500 text-xs">Welcome to #{currentChannel?.name || 'channel'}.</p>
                    </div>

                    {messages.map((msg, index) => {
                        const isCurrentUser = msg.user_id === currentUser?.id;
                        const avatar = msg.users?.avatar_url;
                        const messageRole = msg.users?.role || null;
                        const canDelete = canDeleteMessage(msg.user_id || '', messageRole);
                        const urls = extractUrls(msg.content || '');
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const isGrouped = shouldGroupWithPrevious(msg, prevMsg);

                        // Date Divider
                        const currentDate = new Date(msg.sent_at || Date.now());
                        const outputDate = currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                        let showDivider = false;
                        if (index === 0) showDivider = true;
                        else {
                            const prevDate = new Date(messages[index - 1].sent_at || Date.now());
                            if (currentDate.toDateString() !== prevDate.toDateString()) showDivider = true;
                        }

                        return (
                            <div key={msg.id}>
                                {showDivider && (
                                    <div className="flex items-center justify-center my-6 gap-4">
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1 max-w-[8rem]"></div>
                                        <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-medium text-slate-400">
                                            {outputDate}
                                        </span>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1 max-w-[8rem]"></div>
                                    </div>
                                )}

                                {/* Message Row - Fixed Structure */}
                                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
                                    {/* Left side: Avatar for other users */}
                                    {!isCurrentUser && (
                                        <div className="w-10 mr-3 flex-shrink-0">
                                            {!isGrouped && (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (msg.username?.[0]?.toUpperCase() || 'U')}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Message Bubble Container */}
                                    <div className={`relative max-w-[70%] group/msg ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                                        {/* Username & Time - Only for non-grouped */}
                                        {!isGrouped && (
                                            <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                                <span className="font-semibold text-sm text-white">{msg.username}</span>
                                                {messageRole && messageRole !== 'user' && (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide
                                                        ${messageRole === 'admin'
                                                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 shadow-sm shadow-amber-500/10'
                                                            : messageRole === 'moderator'
                                                                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-300 shadow-sm shadow-violet-500/10'
                                                                : messageRole === 'vip'
                                                                    ? 'bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 border-2 border-pink-400/50 shadow-lg shadow-pink-500/30 animate-pulse'
                                                                    : 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-300 shadow-sm shadow-violet-500/10'
                                                        }`}>
                                                        <span className={messageRole === 'vip' ? 'bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent' : ''}>
                                                            {messageRole === 'vip' ? '✨ VIP ✨' : messageRole}
                                                        </span>
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-500">
                                                    {formatTime(msg.sent_at)}
                                                    {msg.edited_at && <span className="text-[9px] text-slate-600 ml-1">(edited)</span>}
                                                </span>
                                                {msg.pinned && <span className="material-icons-round text-yellow-500 text-xs">push_pin</span>}
                                            </div>
                                        )}

                                        {/* Message Bubble with Arrow */}
                                        <div className="relative inline-block">
                                            {/* Reply Quote - Show if this message is a reply */}
                                            {msg.reply_to_id && (() => {
                                                const replyToMsg = messages.find(m => m.id === msg.reply_to_id);
                                                if (!replyToMsg) return null;
                                                return (
                                                    <button
                                                        onClick={() => {
                                                            const el = document.getElementById(`msg-${msg.reply_to_id}`);
                                                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            el?.classList.add('bg-violet-500/10');
                                                            setTimeout(() => el?.classList.remove('bg-violet-500/10'), 2000);
                                                        }}
                                                        className={`flex items-center gap-2 mb-1.5 text-left max-w-full group/reply
                                                            ${isCurrentUser ? 'ml-auto' : ''}`}
                                                    >
                                                        <div className={`w-0.5 h-6 rounded-full flex-shrink-0 
                                                            ${isCurrentUser ? 'bg-violet-300/50' : 'bg-slate-500/50'}`} />
                                                        <div className="min-w-0 overflow-hidden">
                                                            <span className={`text-[10px] font-medium 
                                                                ${isCurrentUser ? 'text-violet-200/70' : 'text-slate-400'}`}>
                                                                ↳ {replyToMsg.username}
                                                            </span>
                                                            <p className={`text-[11px] truncate max-w-[200px] 
                                                                ${isCurrentUser ? 'text-violet-100/50' : 'text-slate-500'}
                                                                group-hover/reply:text-violet-300 transition-colors`}>
                                                                {replyToMsg.content?.slice(0, 50)}{(replyToMsg.content?.length || 0) > 50 ? '...' : ''}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })()}

                                            {/* The Message */}
                                            <div
                                                id={`msg-${msg.id}`}
                                                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors duration-500 ${msg.content?.startsWith('[MD]\n') ? '' : 'whitespace-pre-wrap break-words'}
                                                ${isCurrentUser
                                                        ? 'bg-violet-900/40 border border-violet-500/20 text-violet-50 rounded-br-md'
                                                        : 'bg-[#1e1e1e] border border-white/5 text-slate-200 rounded-bl-md'
                                                    }`}
                                            >
                                                {msg.content?.startsWith('[MD]\n') ? (
                                                    <MarkdownRenderer content={msg.content.substring(5)} />
                                                ) : (
                                                    renderMessageContent(msg.content || '')
                                                )}
                                            </div>
                                        </div>

                                        {/* Click-only Arrow - No hover glitch */}
                                        <div
                                            data-message-menu
                                            className={`absolute top-1 ${isCurrentUser ? '-left-8' : '-right-8'}
                                                            ${activeMessageMenu === msg.id ? 'opacity-100' : 'opacity-0 group-hover/msg:opacity-100'}
                                                            transition-opacity duration-150`}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id);
                                                }}
                                                className={`w-6 h-6 rounded-full border border-white/10 
                                                               flex items-center justify-center text-slate-400 
                                                               hover:text-white transition-all shadow-lg
                                                               ${activeMessageMenu === msg.id ? 'bg-violet-600 text-white' : 'bg-[#2a2a2a] hover:bg-white/10'}`}
                                            >
                                                <span className={`material-icons-round text-sm transition-transform duration-200 ${activeMessageMenu === msg.id ? 'rotate-180' : ''}`}>expand_more</span>
                                            </button>

                                            {/* Dropdown Menu - Shows above, positioned to stay within container */}
                                            {activeMessageMenu === msg.id && (
                                                <div
                                                    className={`absolute z-50 bottom-full mb-1 
                                                                    ${isCurrentUser ? 'right-0' : 'left-0'}
                                                                    bg-[#1a1a1a] border border-white/10 rounded-xl 
                                                                    shadow-2xl overflow-hidden w-[180px] animate-scale-in`}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {/* Quick Reactions Row */}
                                                    <div className="p-2 border-b border-white/5 flex gap-1 justify-center">
                                                        {REACTION_EMOJIS.map(emoji => {
                                                            const isActive = (msg as any).reactions?.some((r: any) => r.emoji === emoji && r.userIds.includes(currentUser?.id));
                                                            return (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        addReaction(msg.id, emoji);
                                                                        setActiveMessageMenu(null);
                                                                    }}
                                                                    className={`w-9 h-9 rounded-full 
                                                                                   flex items-center justify-center text-xl 
                                                                                   transition-transform hover:scale-125 active:scale-95
                                                                                   ${isActive
                                                                            ? 'bg-violet-600/20 border border-violet-500 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                                                                            : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Menu Actions */}
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(msg);
                                                                setActiveMessageMenu(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 
                                                                           hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <span className="material-icons-round text-lg text-slate-400">reply</span>
                                                            Reply
                                                        </button>

                                                        {isCurrentUser && (() => {
                                                            const messageTime = new Date(msg.sent_at || 0);
                                                            const now = new Date();
                                                            const minutesAgo = (now.getTime() - messageTime.getTime()) / (1000 * 60);
                                                            const canEdit = minutesAgo < 4;

                                                            return canEdit && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessage(msg);
                                                                        setInputValue(msg.content || '');
                                                                        setActiveMessageMenu(null);
                                                                        inputRef.current?.focus();
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-slate-300 
                                                                                   hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <span className="material-icons-round text-lg text-slate-400">edit</span>
                                                                    Edit Message
                                                                    <span className="ml-auto text-[10px] text-slate-500">
                                                                        {Math.floor(4 - minutesAgo)}m left
                                                                    </span>
                                                                </button>
                                                            );
                                                        })()}

                                                        {canPin && (
                                                            <button
                                                                onClick={() => {
                                                                    msg.pinned ? unpinMessage(msg.id) : pinMessage(msg.id);
                                                                    setActiveMessageMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-300 
                                                                               hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <span className={`material-icons-round text-lg ${msg.pinned ? 'text-yellow-500' : 'text-slate-400'}`}>push_pin</span>
                                                                {msg.pinned ? 'Unpin Message' : 'Pin Message'}
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteConfirmId(msg.id);
                                                                    setActiveMessageMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-red-400 
                                                                               hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                            >
                                                                <span className="material-icons-round text-lg">delete</span>
                                                                Delete Message
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Link Previews */}
                                        {urls.length > 0 && (
                                            <div className="mt-2">
                                                {urls.slice(0, 1).map((url, i) => (
                                                    <LinkPreview key={i} url={url} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Reactions Display */}
                                        {(msg as any).reactions && (msg as any).reactions.length > 0 && (
                                            <div className={`flex items-center gap-1.5 mt-2 flex-wrap ${isCurrentUser ? 'justify-end' : ''}`}>
                                                {(msg as any).reactions.map((reaction: { emoji: string; count: number; userIds: string[]; usernames?: string[] }) => {
                                                    const hasReacted = reaction.userIds.includes(currentUser?.id || '');
                                                    const tooltipText = reaction.usernames?.join(', ') || 'Loading...';
                                                    return (
                                                        <button
                                                            key={reaction.emoji}
                                                            onClick={() => setViewingReaction({
                                                                emoji: reaction.emoji,
                                                                count: reaction.count,
                                                                usernames: reaction.usernames || []
                                                            })}
                                                            title={`${tooltipText} reacted with ${reaction.emoji}`}
                                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer
                                                                ${hasReacted
                                                                    ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                                                                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            <span>{reaction.emoji}</span>
                                                            <span className="font-medium">{reaction.count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side: Avatar for current user */}
                                    {isCurrentUser && (
                                        <div className="w-10 ml-3 flex-shrink-0">
                                            {!isGrouped && (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : 'Me'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                <TypingIndicator typingUsers={typingUsers} />

                {/* Jump to Latest */}
                <JumpToLatest show={showJumpButton} newMessageCount={newMessageCount} onClick={scrollToBottom} />

                {/* Reply Preview - Smooth animation */}
                {replyingTo && (
                    <div className="px-6 py-2.5 bg-gradient-to-r from-violet-500/10 to-purple-500/5 border-t border-violet-500/20 flex items-center justify-between animate-slide-up backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-sm overflow-hidden">
                            <div className="w-1 h-8 bg-violet-500 rounded-full flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-violet-400 text-base">reply</span>
                                    <span className="text-slate-400 text-xs">Replying to</span>
                                    <span className="text-white font-medium text-xs">{replyingTo.username}</span>
                                </div>
                                <p className="text-slate-500 truncate text-xs mt-0.5 max-w-[300px]">{replyingTo.content}</p>
                            </div>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all">
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-white/5">
                    <div className="relative">
                        {/* Mention Dropdown - Shows Members and Files */}
                        {showMentionDropdown && hasMentionMatches && (
                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in">
                                {/* Tabs */}
                                <div className="flex border-b border-white/5">
                                    <button
                                        onClick={() => setMentionTab('members')}
                                        className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-wider transition-colors
                                            ${mentionTab === 'members'
                                                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/10'
                                                : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            <span className="material-icons-round text-xs">person</span>
                                            Members ({filteredMentionUsers.length})
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setMentionTab('files')}
                                        className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-wider transition-colors
                                            ${mentionTab === 'files'
                                                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/10'
                                                : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            <span className="material-icons-round text-xs">attach_file</span>
                                            Files ({filteredMentionFiles.length})
                                        </span>
                                    </button>
                                </div>

                                {/* Members List */}
                                {mentionTab === 'members' && (
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredMentionUsers.length > 0 ? (
                                            filteredMentionUsers.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => insertMention(user.username || '')}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
                                                >
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white">
                                                            {user.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-white">{user.username}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-3 text-center text-xs text-slate-500">
                                                No members found
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Files List */}
                                {mentionTab === 'files' && (
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredMentionFiles.length > 0 ? (
                                            filteredMentionFiles.map(file => {
                                                const typeInfo = getFileTypeInfo(file.file_type);
                                                return (
                                                    <button
                                                        key={file.id}
                                                        onClick={() => insertFileMention(file)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
                                                    >
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${typeInfo.color} bg-white/5`}>
                                                            <span className="material-icons-round text-sm">{typeInfo.icon}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white truncate">{file.display_name || file.original_filename}</p>
                                                            <p className="text-[10px] text-slate-500 truncate">
                                                                {file.file_type.split('/')[1]?.toUpperCase()} • by {file.uploader?.username || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="px-3 py-3 text-center text-xs text-slate-500">
                                                No files found in this channel
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div
                            className={`bg-[#1e1e1e] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 relative
                                ${isAnnouncement && !isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={() => isAnnouncement && !isAdmin && setShowRestrictedModal(true)}
                        >
                            {/* Add Button with Menu */}
                            <div className="relative" data-add-button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddMenu(!showAddMenu)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                    disabled={isAnnouncement && !isAdmin}
                                >
                                    <span className="material-icons-round text-xl">add_circle</span>
                                </button>

                                {/* Add Menu Dropdown */}
                                {showAddMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden w-56 animate-scale-in z-50" data-add-menu>
                                        <button
                                            onClick={() => {
                                                setShowMarkdownComposer(true);
                                                setShowAddMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                                        >
                                            <span className="material-icons-round text-lg text-violet-400">edit_note</span>
                                            <div>
                                                <div className="font-medium text-white">Send as Markdown</div>
                                                <div className="text-xs text-slate-500">Format with headers, lists, etc.</div>
                                            </div>
                                        </button>
                                        <div className="border-t border-white/5" />
                                        <button
                                            onClick={() => {
                                                setShowAddMenu(false);
                                                // Add file upload functionality here if needed
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                                        >
                                            <span className="material-icons-round text-lg text-emerald-400">attach_file</span>
                                            <div>
                                                <div className="font-medium text-white">Upload File</div>
                                                <div className="text-xs text-slate-500">Share images, docs, etc.</div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isAnnouncement && !isAdmin ? "Only admin can message" : `Message #${currentChannel?.name || 'channel'}...`}
                                disabled={isAnnouncement && !isAdmin}
                                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500"
                            />
                            <button className="text-slate-500 hover:text-white transition-colors" disabled={isAnnouncement && !isAdmin}>
                                <span className="material-icons-round text-xl">mood</span>
                            </button>

                            {/* Send Button - Only visible when text exists */}
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || (isAnnouncement && !isAdmin)}
                                className={`p-2 rounded-xl transition-all duration-200
                                    ${inputValue.trim()
                                        ? 'bg-violet-600 text-white hover:bg-violet-500 scale-100 opacity-100'
                                        : 'bg-slate-700/50 text-slate-500 scale-95 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <span className="material-icons-round text-lg">send</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2 px-1">
                            <p className="text-[10px] text-slate-600">
                                <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">```</span> for code • <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">@</span> to mention • Markdown supported
                            </p>
                            <button
                                onClick={() => setShowDemoModal(true)}
                                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 hover:underline decoration-violet-400/30 underline-offset-2"
                            >
                                <span className="material-icons-round text-sm">help_outline</span>
                                Have doubts on chat? Check the demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modals - Using UniversalModal */}
                <UniversalModal
                    isOpen={showRestrictedModal}
                    onClose={() => setShowRestrictedModal(false)}
                    title="Restricted Access"
                    message="Only admins can post in Announcements."
                    icon="lock"
                    confirmText="Got it"
                    showCancel={false}
                />

                <UniversalModal
                    isOpen={!!deleteConfirmId}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={() => deleteConfirmId && handleDeleteClick(deleteConfirmId)}
                    title="Delete Message?"
                    message="This action cannot be undone."
                    variant="danger"
                    confirmText="Delete"
                    cancelText="Cancel"
                />
            </div>

            {/* Pinned Panel */}
            <PinnedMessagesPanel
                isOpen={showPinnedPanel}
                onClose={() => setShowPinnedPanel(false)}
                pinnedMessages={pinnedMessages}
                onUnpin={unpinMessage}
                canUnpin={canPin}
            />

            {/* Reaction Users Modal */}
            {
                viewingReaction && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setViewingReaction(null)}
                    >
                        <div
                            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 min-w-[240px] max-w-sm shadow-2xl animate-scale-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{viewingReaction.emoji}</span>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Reactions</h3>
                                        <p className="text-[10px] text-slate-400">{viewingReaction.count} people reacted</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingReaction(null)}
                                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {viewingReaction.usernames?.length > 0 ? (
                                    viewingReaction.usernames.map((name, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center text-xs font-bold text-violet-300 ring-1 ring-violet-500/30">
                                                {name[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm text-slate-200 font-medium">{name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-slate-500 text-xs">
                                        Loading users...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Online Users Sidebar */}
            <OnlineUsersList onlineUsers={onlineUsers} currentUserId={currentUser?.id || null} />

            {/* Chat Demo Modal */}
            <ChatDemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />

            {/* Channel Settings Modal */}
            {currentChannel && (
                <ChannelSettingsModal
                    isOpen={showSettingsModal}
                    onClose={() => setShowSettingsModal(false)}
                    channel={currentChannel}
                    onChannelDeleted={() => {
                        setShowSettingsModal(false);
                        onChannelDeleted?.();
                    }}
                    currentUserRole={currentUser?.role}
                />
            )}

            {/* File Mention Popup Modal */}
            {/* File Preview Panel */}
            <FilePreviewPanel
                file={activeFileMention as any}
                onClose={() => setActiveFileMention(null)}
                onDownload={async (file) => {
                    try {
                        const url = await getFileUrl(file.storage_path);
                        if (url) {
                            const response = await fetch(url);
                            const blob = await response.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = file.original_filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(blobUrl);
                        }
                    } catch (error) {
                        console.error('Download failed:', error);
                    }
                    setActiveFileMention(null);
                }}
                onViewInFiles={(file) => {
                    setActiveFileMention(null);
                    onSwitchToFiles?.();
                }}
                getFileUrl={getFileUrl}
            />

            {/* Markdown Composer Modal */}
            <MarkdownComposerModal
                isOpen={showMarkdownComposer}
                onClose={() => setShowMarkdownComposer(false)}
                onSend={handleMarkdownSend}
            />
        </div>
    );
}
