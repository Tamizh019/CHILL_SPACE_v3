'use client';

import { useState } from 'react';
import { FileRecord } from '@/hooks/useFiles';
import { getFileTypeInfo, formatFileSize, getRelativeTime, isImage, isVideo } from '@/utils/fileUtils';

interface FileCardProps {
    file: FileRecord;
    onSelect: (file: FileRecord) => void;
    onReact?: (fileId: string, emoji: string) => void;
    currentUserId?: string;
    fileUrl?: string | null;
    viewMode?: 'grid' | 'list';
}

const QUICK_REACTIONS = ['👍', '❤️', '🔥'];

export function FileCard({
    file,
    onSelect,
    onReact,
    currentUserId,
    fileUrl,
    viewMode = 'grid'
}: FileCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const typeInfo = getFileTypeInfo(file.file_type);

    const canPreview = (isImage(file.file_type) || isVideo(file.file_type)) && fileUrl && !imageError;
    const totalReactions = file.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;

    if (viewMode === 'list') {
        return (
            <button
                onClick={() => onSelect(file)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a] border border-white/5 
                           hover:border-violet-500/30 hover:bg-white/[0.02] transition-all group text-left"
            >
                {/* Icon/Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {canPreview ? (
                        <img
                            src={fileUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <span className={`material-icons-round text-2xl ${typeInfo.color}`}>
                            {typeInfo.icon}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate group-hover:text-violet-300 transition-colors">
                        {file.display_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                        {formatFileSize(file.file_size)} • {file.uploader?.username || 'Unknown'} • {getRelativeTime(file.created_at)}
                    </p>
                </div>

                {/* Reactions & Comments */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    {totalReactions > 0 && (
                        <span className="flex items-center gap-1">
                            <span>😊</span>
                            <span>{totalReactions}</span>
                        </span>
                    )}
                    {(file._count?.comments || 0) > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="material-icons-round text-sm">chat_bubble</span>
                            <span>{file._count?.comments}</span>
                        </span>
                    )}
                </div>
            </button>
        );
    }

    // Grid view (default)
    return (
        <div
            className="group relative bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden
                       hover:border-violet-500/30 transition-all duration-200 cursor-pointer"
            onClick={() => onSelect(file)}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
        >
            {/* Preview Area */}
            <div className="aspect-square bg-black/30 flex items-center justify-center relative overflow-hidden">
                {canPreview ? (
                    isVideo(file.file_type) ? (
                        <video
                            src={fileUrl}
                            className="w-full h-full object-cover"
                            muted
                        />
                    ) : (
                        <img
                            src={fileUrl}
                            alt={file.display_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={() => setImageError(true)}
                        />
                    )
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <span className={`material-icons-round text-5xl ${typeInfo.color}`}>
                            {typeInfo.icon}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                    </div>
                )}

                {/* Video play indicator */}
                {isVideo(file.file_type) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="material-icons-round text-white text-2xl">play_arrow</span>
                        </div>
                    </div>
                )}

                {/* Quick reactions overlay */}
                {showReactions && onReact && (
                    <div
                        className="absolute top-2 right-2 flex gap-1 animate-fade-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {QUICK_REACTIONS.map(emoji => {
                            const hasReacted = file.reactions?.some(
                                r => r.emoji === emoji && r.userIds.includes(currentUserId || '')
                            );
                            return (
                                <button
                                    key={emoji}
                                    onClick={() => onReact(file.id, emoji)}
                                    className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center
                                               text-sm transition-all hover:scale-110 active:scale-95
                                               ${hasReacted
                                            ? 'bg-violet-500/40 border border-violet-400/50'
                                            : 'bg-black/50 border border-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-3 space-y-2">
                <p className="font-medium text-white text-sm truncate group-hover:text-violet-300 transition-colors">
                    {file.display_name}
                </p>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                        {formatFileSize(file.file_size)}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {file.uploader?.avatar_url ? (
                            <img
                                src={file.uploader.avatar_url}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-violet-500/30 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-violet-300">
                                    {file.uploader?.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                        <span className="text-slate-400 truncate max-w-[60px]">
                            {file.uploader?.username || 'Unknown'}
                        </span>
                    </div>
                </div>

                {/* Reactions & Comments Row */}
                {(totalReactions > 0 || (file._count?.comments || 0) > 0) && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        {file.reactions && file.reactions.length > 0 && (
                            <div className="flex items-center gap-0.5">
                                {file.reactions.slice(0, 3).map(r => (
                                    <span key={r.emoji} className="text-xs">{r.emoji}</span>
                                ))}
                                <span className="text-[10px] text-slate-500 ml-1">{totalReactions}</span>
                            </div>
                        )}
                        {(file._count?.comments || 0) > 0 && (
                            <div className="flex items-center gap-1 text-slate-500">
                                <span className="material-icons-round text-xs">chat_bubble</span>
                                <span className="text-[10px]">{file._count?.comments}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
