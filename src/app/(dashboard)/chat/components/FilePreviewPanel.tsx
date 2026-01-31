'use client';

import { useState, useEffect } from 'react';

interface FileRecord {
    id: string;
    original_filename: string;
    display_name: string | null;
    storage_path: string;
    file_type: string;
    file_size: number | null;
    description: string | null;
    created_at: string;
    uploader?: { id?: string; username: string | null; avatar_url?: string | null } | null;
}

interface FilePreviewPanelProps {
    file: FileRecord | null;
    onClose: () => void;
    onDownload: (file: FileRecord) => Promise<void>;
    onViewInFiles?: (file: FileRecord) => void;
    getFileUrl: (path: string) => Promise<string | null>;
}

const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; bgGradient: string }> = {
    'image': { icon: 'image', color: 'text-emerald-400', bgGradient: 'from-emerald-500/20 to-teal-500/20' },
    'video': { icon: 'play_circle', color: 'text-purple-400', bgGradient: 'from-purple-500/20 to-pink-500/20' },
    'audio': { icon: 'audio_file', color: 'text-pink-400', bgGradient: 'from-pink-500/20 to-rose-500/20' },
    'pdf': { icon: 'picture_as_pdf', color: 'text-red-400', bgGradient: 'from-red-500/20 to-orange-500/20' },
    'document': { icon: 'description', color: 'text-blue-400', bgGradient: 'from-blue-500/20 to-indigo-500/20' },
    'spreadsheet': { icon: 'table_chart', color: 'text-green-400', bgGradient: 'from-green-500/20 to-emerald-500/20' },
    'archive': { icon: 'folder_zip', color: 'text-amber-400', bgGradient: 'from-amber-500/20 to-yellow-500/20' },
    'code': { icon: 'code', color: 'text-cyan-400', bgGradient: 'from-cyan-500/20 to-blue-500/20' },
    'default': { icon: 'insert_drive_file', color: 'text-slate-400', bgGradient: 'from-slate-500/20 to-zinc-500/20' }
};

function getFileConfig(mimeType: string) {
    if (mimeType.startsWith('image/')) return FILE_TYPE_CONFIG.image;
    if (mimeType.startsWith('video/')) return FILE_TYPE_CONFIG.video;
    if (mimeType.startsWith('audio/')) return FILE_TYPE_CONFIG.audio;
    if (mimeType === 'application/pdf') return FILE_TYPE_CONFIG.pdf;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FILE_TYPE_CONFIG.spreadsheet;
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text/plain')) return FILE_TYPE_CONFIG.document;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return FILE_TYPE_CONFIG.archive;
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python') || mimeType.includes('json')) return FILE_TYPE_CONFIG.code;
    return FILE_TYPE_CONFIG.default;
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateString: string | null): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function FilePreviewPanel({ file, onClose, onDownload, onViewInFiles, getFileUrl }: FilePreviewPanelProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (file && file.file_type.startsWith('image/')) {
            getFileUrl(file.storage_path).then(url => setPreviewUrl(url));
        } else {
            setPreviewUrl(null);
        }
    }, [file, getFileUrl]);

    if (!file) return null;

    const config = getFileConfig(file.file_type);
    const fileName = file.display_name || file.original_filename;
    const fileExtension = file.file_type.split('/')[1]?.toUpperCase() || 'FILE';

    const handleDownload = async () => {
        setIsDownloading(true);
        await onDownload(file);
        setIsDownloading(false);
    };

    const handleCopyLink = async () => {
        const url = await getFileUrl(file.storage_path);
        if (url) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <div className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-[#0f0f0f] border-l border-white/10 shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">

                {/* Header with gradient */}
                <div className={`relative bg-gradient-to-br ${config.bgGradient} p-6 pb-16`}>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all"
                    >
                        <span className="material-icons-round">close</span>
                    </button>

                    {/* File type badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 ${config.color} text-xs font-semibold uppercase tracking-wide mb-4`}>
                        <span className="material-icons-round text-sm">{config.icon}</span>
                        {fileExtension}
                    </div>

                    {/* File name */}
                    <h2 className="text-xl font-bold text-white leading-tight pr-8 line-clamp-2">
                        {fileName}
                    </h2>
                </div>

                {/* Preview Area */}
                <div className="-mt-10 px-6 relative z-10">
                    <div className={`rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-xl`}>
                        {file.file_type.startsWith('image/') && previewUrl ? (
                            <img
                                src={previewUrl}
                                alt={fileName}
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div className={`h-32 bg-gradient-to-br ${config.bgGradient} flex items-center justify-center`}>
                                <span className={`material-icons-round text-6xl ${config.color} opacity-50`}>
                                    {config.icon}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* File Details */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Size</div>
                            <div className="font-semibold text-white">{formatFileSize(file.file_size)}</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Type</div>
                            <div className="font-semibold text-white">{fileExtension}</div>
                        </div>
                    </div>

                    {/* Uploader Info */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Uploaded by</div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {file.uploader?.avatar_url ? (
                                    <img src={file.uploader.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    file.uploader?.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div>
                                <div className="font-semibold text-white">{file.uploader?.username || 'Unknown'}</div>
                                <div className="text-xs text-slate-500">{formatDate(file.created_at)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Description if available */}
                    {file.description && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Description</div>
                            <p className="text-slate-300 text-sm">{file.description}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 space-y-3">
                    {/* Download Button */}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round">download</span>
                                Download File
                            </>
                        )}
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCopyLink}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium transition-all"
                        >
                            <span className="material-icons-round text-lg">
                                {copied ? 'check' : 'link'}
                            </span>
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>

                        {onViewInFiles && (
                            <button
                                onClick={() => onViewInFiles(file)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium transition-all"
                            >
                                <span className="material-icons-round text-lg">folder_open</span>
                                View in Files
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
