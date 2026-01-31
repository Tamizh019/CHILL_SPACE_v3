'use client';

import { useState, useEffect, useRef } from 'react';
import { FileComment } from '@/hooks/useFiles';
import { getRelativeTime } from '@/utils/fileUtils';

interface FileCommentsProps {
    fileId: string;
    comments: FileComment[];
    onAddComment: (fileId: string, content: string) => Promise<FileComment | null>;
    onDeleteComment?: (commentId: string, fileId: string) => Promise<boolean>;
    currentUserId?: string;
    isLoading?: boolean;
}

export function FileComments({
    fileId,
    comments,
    onAddComment,
    onDeleteComment,
    currentUserId,
    isLoading = false
}: FileCommentsProps) {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [localComments, setLocalComments] = useState<FileComment[]>(comments);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Update local comments when props change
    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    // Auto-scroll to bottom when new comment added
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localComments.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        setIsSending(true);
        try {
            const newComment = await onAddComment(fileId, input.trim());
            if (newComment) {
                setLocalComments(prev => [...prev, newComment]);
                setInput('');
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!onDeleteComment) return;
        const success = await onDeleteComment(commentId, fileId);
        if (success) {
            setLocalComments(prev => prev.filter(c => c.id !== commentId));
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <span className="material-icons-round text-slate-400 text-lg">chat_bubble</span>
                <h3 className="font-medium text-white text-sm">
                    Comments ({localComments.length})
                </h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
                {localComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                            <span className="material-icons-round text-2xl text-slate-600">forum</span>
                        </div>
                        <p className="text-sm text-slate-500">No comments yet</p>
                        <p className="text-xs text-slate-600 mt-1">Be the first to comment!</p>
                    </div>
                ) : (
                    localComments.map(comment => (
                        <div key={comment.id} className="flex gap-3 group">
                            {/* Avatar */}
                            {comment.user?.avatar_url ? (
                                <img
                                    src={comment.user.avatar_url}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-violet-300">
                                        {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-white">
                                        {comment.user?.username || 'Unknown'}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {getRelativeTime(comment.created_at)}
                                    </span>

                                    {/* Delete button (own comments only) */}
                                    {comment.user_id === currentUserId && onDeleteComment && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                        >
                                            <span className="material-icons-round text-sm text-red-400 hover:text-red-300">
                                                delete
                                            </span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 mt-0.5 break-words">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2
                              focus-within:border-violet-500/50 transition-colors">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Add a comment..."
                        disabled={isSending}
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 
                                 focus:outline-none disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isSending}
                        className={`p-1.5 rounded-lg transition-all
                            ${input.trim()
                                ? 'bg-violet-600 text-white hover:bg-violet-500'
                                : 'bg-white/5 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-icons-round text-lg">
                            {isSending ? 'hourglass_empty' : 'send'}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}
