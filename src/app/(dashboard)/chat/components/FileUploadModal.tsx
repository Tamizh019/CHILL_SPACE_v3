'use client';

import { useState, useRef, useCallback } from 'react';
import { FileRecord, FileMetadata } from '@/hooks/useFiles';
import { formatFileSize, getFileTypeInfo, isImage, validateFileSize, MAX_FILE_SIZE } from '@/utils/fileUtils';
import { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, metadata: FileMetadata) => Promise<FileRecord | null>;
    channels: Channel[];
    defaultChannelId?: string;
    uploadProgress?: { loaded: number; total: number; percentage: number } | null;
}

export function FileUploadModal({
    isOpen,
    onClose,
    onUpload,
    channels,
    defaultChannelId,
    uploadProgress
}: FileUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [channelId, setChannelId] = useState(defaultChannelId || channels[0]?.id || '');
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((file: File) => {
        setError(null);

        // Validate size
        const validation = validateFileSize(file);
        if (!validation.valid) {
            setError(validation.error || 'File too large');
            return;
        }

        setSelectedFile(file);
        setDisplayName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for display name

        // Generate preview for images
        if (isImage(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleUpload = async () => {
        if (!selectedFile || !channelId || !displayName.trim()) return;

        setIsUploading(true);
        setError(null);

        try {
            const result = await onUpload(selectedFile, {
                displayName: displayName.trim(),
                description: description.trim() || undefined,
                channelId,
            });

            if (result) {
                // Reset and close
                resetForm();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreview(null);
        setDisplayName('');
        setDescription('');
        setError(null);
        setChannelId(defaultChannelId || channels[0]?.id || '');
    };

    const handleClose = () => {
        if (!isUploading) {
            resetForm();
            onClose();
        }
    };

    if (!isOpen) return null;

    const typeInfo = selectedFile ? getFileTypeInfo(selectedFile.type) : null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl shadow-2xl animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <span className="material-icons-round text-violet-400">upload_file</span>
                        </div>
                        <div>
                            <h2 className="font-heading font-bold text-lg text-white">Upload File</h2>
                            <p className="text-xs text-slate-500">Max size: {formatFileSize(MAX_FILE_SIZE)}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Drop Zone / Preview */}
                    {!selectedFile ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${isDragging
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                                    ${isDragging ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                                    <span className={`material-icons-round text-3xl ${isDragging ? 'text-violet-400' : 'text-slate-500'}`}>
                                        cloud_upload
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">
                                        {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Supports all file types up to 50MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                            {/* Preview/Icon */}
                            <div className="w-20 h-20 rounded-xl bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className={`material-icons-round text-3xl ${typeInfo?.color}`}>
                                        {typeInfo?.icon}
                                    </span>
                                )}
                            </div>

                            {/* File info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{selectedFile.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreview(null);
                                        setDisplayName('');
                                    }}
                                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Remove file
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    {selectedFile && (
                        <>
                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter a display name..."
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white 
                                             placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                                    Description <span className="text-slate-600">(optional)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a description..."
                                    rows={2}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white 
                                             placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                                />
                            </div>

                            {/* Channel Selector */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                                    Save to Channel *
                                </label>
                                <div className="relative">
                                    <select
                                        value={channelId}
                                        onChange={(e) => setChannelId(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white 
                                                 focus:outline-none focus:border-violet-500/50 transition-colors appearance-none cursor-pointer"
                                    >
                                        {channels.map(channel => (
                                            <option key={channel.id} value={channel.id}>
                                                #{channel.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            <span className="material-icons-round text-lg">error</span>
                            {error}
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploadProgress && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Uploading...</span>
                                <span className="text-violet-400">{uploadProgress.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress.percentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || !displayName.trim() || !channelId || isUploading}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-violet-600 text-white 
                                 hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <span className="material-icons-round text-lg animate-spin">refresh</span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round text-lg">upload</span>
                                Upload File
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
