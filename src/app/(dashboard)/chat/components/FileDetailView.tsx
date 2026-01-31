'use client';

import { useState, useEffect } from 'react';
import { FileRecord, FileComment } from '@/hooks/useFiles';
import { FileComments } from './FileComments';
import { getFileTypeInfo, formatFileSize, getRelativeTime, isImage, isVideo } from '@/utils/fileUtils';

interface FileDetailViewProps {
    file: FileRecord | null;
    fileUrl: string | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (fileId: string) => Promise<boolean>;
    onReact: (fileId: string, emoji: string) => Promise<boolean>;
    onDownload: (file: FileRecord, url: string) => void;
    getComments: (fileId: string) => Promise<FileComment[]>;
    addComment: (fileId: string, content: string) => Promise<FileComment | null>;
    deleteComment: (commentId: string, fileId: string) => Promise<boolean>;
    currentUserId?: string;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '🤩'];

export function FileDetailView({
    file,
    fileUrl,
    isOpen,
    onClose,
    onDelete,
    onReact,
    onDownload,
    getComments,
    addComment,
    deleteComment,
    currentUserId
}: FileDetailViewProps) {
    const [comments, setComments] = useState<FileComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Fetch comments when file changes
    useEffect(() => {
        if (file && isOpen) {
            setIsLoadingComments(true);
            getComments(file.id).then(data => {
                setComments(data);
                setIsLoadingComments(false);
            });
        }
    }, [file?.id, isOpen, getComments]);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setComments([]);
            setShowDeleteConfirm(false);
            setImageError(false);
        }
    }, [isOpen]);

    if (!isOpen || !file) return null;

    const typeInfo = getFileTypeInfo(file.file_type);
    const isOwner = file.uploader_id === currentUserId;

    // Check file types for preview support
    const isPdf = file.file_type === 'application/pdf';
    const isText = file.file_type.startsWith('text/') ||
        file.file_type === 'application/json' ||
        file.file_type === 'application/javascript' ||
        file.original_filename?.endsWith('.txt') ||
        file.original_filename?.endsWith('.md') ||
        file.original_filename?.endsWith('.json') ||
        file.original_filename?.endsWith('.js') ||
        file.original_filename?.endsWith('.ts') ||
        file.original_filename?.endsWith('.css') ||
        file.original_filename?.endsWith('.html');

    const canPreviewImage = (isImage(file.file_type) || isVideo(file.file_type)) && fileUrl && !imageError;
    const canPreviewPdf = isPdf && fileUrl;
    const canPreview = canPreviewImage || canPreviewPdf;

    const handleDelete = async () => {
        setIsDeleting(true);
        const success = await onDelete(file.id);
        if (success) {
            onClose();
        }
        setIsDeleting(false);
    };

    const handleDownload = () => {
        if (fileUrl) {
            onDownload(file, fileUrl);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-stretch bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            {/* Main Panel */}
            <div
                className="flex-1 flex flex-col items-center justify-center p-8"
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 
                             flex items-center justify-center text-white transition-colors z-10"
                >
                    <span className="material-icons-round">close</span>
                </button>

                {/* Preview Area */}
                <div className="flex-1 flex items-center justify-center w-full max-w-4xl">
                    {canPreviewPdf ? (
                        /* PDF Preview with iframe */
                        <div className="w-full h-[70vh] rounded-xl overflow-hidden shadow-2xl bg-white">
                            <iframe
                                src={`${fileUrl}#toolbar=1&navpanes=0`}
                                className="w-full h-full"
                                title={file.display_name}
                            />
                        </div>
                    ) : canPreviewImage ? (
                        isVideo(file.file_type) ? (
                            <video
                                src={fileUrl || undefined}
                                controls
                                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
                            />
                        ) : (
                            <img
                                src={fileUrl || undefined}
                                alt={file.display_name}
                                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain"
                                onError={() => setImageError(true)}
                            />
                        )
                    ) : (
                        /* Non-previewable file with download button */
                        <div className="flex flex-col items-center gap-6 p-12 bg-[#1a1a1a] border border-white/10 rounded-2xl">
                            <span className={`material-icons-round text-7xl ${typeInfo.color}`}>
                                {typeInfo.icon}
                            </span>
                            <div className="text-center">
                                <p className="text-white font-medium text-lg">{file.display_name}</p>
                                <p className="text-slate-500 text-sm mt-1">
                                    {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'} • {formatFileSize(file.file_size)}
                                </p>
                            </div>

                            {/* Download Button for non-previewable files */}
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white 
                                         hover:bg-violet-500 transition-colors text-sm font-medium shadow-lg"
                            >
                                <span className="material-icons-round">download</span>
                                Download File
                            </button>

                            <p className="text-xs text-slate-600">Preview not available for this file type</p>
                        </div>
                    )}
                </div>

                {/* File Info Bar */}
                <div className="w-full max-w-4xl mt-6 p-4 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between">
                        {/* File info */}
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color} bg-white/5`}>
                                <span className="material-icons-round text-xl">{typeInfo.icon}</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-white">{file.display_name}</h3>
                                <p className="text-xs text-slate-500">
                                    {formatFileSize(file.file_size)} • {getRelativeTime(file.created_at)} • by {file.uploader?.username || 'Unknown'}
                                    {file.channel && <span> • in #{file.channel.name}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white 
                                         hover:bg-violet-500 transition-colors text-sm font-medium"
                            >
                                <span className="material-icons-round text-lg">download</span>
                                Download
                            </button>

                            {isOwner && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 
                                             hover:bg-red-500/20 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-icons-round">delete</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {file.description && (
                        <p className="mt-3 pt-3 border-t border-white/5 text-sm text-slate-400">
                            {file.description}
                        </p>
                    )}

                    {/* Reactions */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
                        {REACTION_EMOJIS.map(emoji => {
                            const reaction = file.reactions?.find(r => r.emoji === emoji);
                            const hasReacted = reaction?.userIds.includes(currentUserId || '');
                            const count = reaction?.count || 0;

                            return (
                                <button
                                    key={emoji}
                                    onClick={() => onReact(file.id, emoji)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                                        ${hasReacted
                                            ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                                            : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span>{emoji}</span>
                                    {count > 0 && <span className="text-xs font-medium">{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Comments Sidebar */}
            <div
                className="w-80 bg-[#121212] border-l border-white/5 flex flex-col animate-slide-in-right"
                onClick={e => e.stopPropagation()}
            >
                <FileComments
                    fileId={file.id}
                    comments={comments}
                    onAddComment={addComment}
                    onDeleteComment={deleteComment}
                    currentUserId={currentUserId}
                    isLoading={isLoadingComments}
                />
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <span className="material-icons-round text-red-400">delete</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Delete File?</h3>
                                <p className="text-xs text-slate-500">This cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-400 mb-6">
                            Are you sure you want to delete <strong className="text-white">{file.display_name}</strong>?
                            This will also remove all comments and reactions.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 
                                         transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 
                                         transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-icons-round text-sm animate-spin">refresh</span>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
