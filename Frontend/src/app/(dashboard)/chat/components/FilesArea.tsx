'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFiles, FileRecord } from '@/hooks/useFiles';
import { FileCard } from './FileCard';
import { FileUploadModal } from './FileUploadModal';
import { FileDetailView } from './FileDetailView';
import { filterFilesBySearch, getFileCategory } from '@/utils/fileUtils';
import { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];
type User = Database['public']['Tables']['users']['Row'];

interface FilesAreaProps {
    selectedChannelId: string | null;
    channels: Channel[];
    currentUser: User | null;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'size';
type FilterBy = 'all' | 'image' | 'video' | 'document' | 'other';

export function FilesArea({ selectedChannelId, channels, currentUser }: FilesAreaProps) {

    // Determine if we're viewing "my-uploads" or a specific channel
    const isMyUploads = selectedChannelId === 'my-uploads';
    const channelIdForQuery = isMyUploads ? null : selectedChannelId;

    const {
        files: allFiles,
        isLoading,
        uploadProgress,
        uploadFile,
        deleteFile,
        getFileUrl,
        addReaction,
        getComments,
        addComment,
        deleteComment,
        incrementDownload,
        refetch
    } = useFiles(channelIdForQuery);

    // Filter for "my-uploads"
    const files = useMemo(() => {
        if (isMyUploads && currentUser) {
            return allFiles.filter(f => f.uploader_id === currentUser.id);
        }
        return allFiles;
    }, [allFiles, isMyUploads, currentUser]);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
    const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [filterBy, setFilterBy] = useState<FilterBy>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

    // Get the channel name for display
    const currentChannel = channels.find(c => c.id === selectedChannelId);
    const displayTitle = isMyUploads
        ? 'My Uploads'
        : selectedChannelId
            ? `#${currentChannel?.name || 'Unknown'}`
            : 'All Files';

    // Track which file URLs we've already loaded to prevent infinite loops
    const loadedFileIdsRef = useRef<Set<string>>(new Set());

    // Load file URLs for previews - only for new files
    useEffect(() => {
        const loadUrls = async () => {
            const newUrls: Record<string, string> = {};
            let hasNewUrls = false;

            for (const file of files) {
                // Skip if already loaded
                if (loadedFileIdsRef.current.has(file.id)) continue;

                if (file.file_type.startsWith('image/') || file.file_type.startsWith('video/')) {
                    const url = await getFileUrl(file.storage_path);
                    if (url) {
                        newUrls[file.id] = url;
                        hasNewUrls = true;
                    }
                }
                loadedFileIdsRef.current.add(file.id);
            }

            if (hasNewUrls) {
                setFileUrls(prev => ({ ...prev, ...newUrls }));
            }
        };

        if (files.length > 0) {
            loadUrls();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files.length, getFileUrl]);

    // Load selected file URL
    useEffect(() => {
        const loadSelectedUrl = async () => {
            if (selectedFile) {
                const url = await getFileUrl(selectedFile.storage_path);
                setSelectedFileUrl(url);
            } else {
                setSelectedFileUrl(null);
            }
        };
        loadSelectedUrl();
    }, [selectedFile, getFileUrl]);

    // Filter and sort files
    const filteredFiles = useMemo(() => {
        let result = [...files];

        // Apply search filter
        if (searchQuery) {
            result = filterFilesBySearch(result, searchQuery);
        }

        // Apply type filter
        if (filterBy !== 'all') {
            result = result.filter(f => getFileCategory(f.file_type) === filterBy);
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'name':
                    return a.display_name.localeCompare(b.display_name);
                case 'size':
                    return b.file_size - a.file_size;
                default:
                    return 0;
            }
        });

        return result;
    }, [files, searchQuery, filterBy, sortBy]);

    const handleDownload = useCallback(async (file: FileRecord, url: string) => {
        try {
            // Increment download count
            await incrementDownload(file.id);

            // Fetch the file as blob to force download
            const response = await fetch(url);
            const blob = await response.blob();

            // Create object URL and download
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = file.original_filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Error downloading file:', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
        }
    }, [incrementDownload]);

    const handleReact = useCallback(async (fileId: string, emoji: string) => {
        await addReaction(fileId, emoji);
    }, [addReaction]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0c0c0c] to-[#110d1c]">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/10 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <span className="material-icons-round text-violet-400">folder</span>
                    </div>
                    <div>
                        <h2 className="font-heading text-lg font-bold text-white">
                            {displayTitle}
                        </h2>
                        <p className="text-[10px] text-slate-500">
                            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                        </p>
                    </div>
                </div>

                {/* Upload Button */}
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white 
                             hover:bg-violet-500 transition-colors text-sm font-medium"
                >
                    <span className="material-icons-round text-lg">add</span>
                    Upload File
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/5 flex-shrink-0">
                {/* Search */}
                <div className="relative w-64">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full h-9 bg-black/20 border border-white/5 rounded-lg pl-9 pr-4 
                                 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/30 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors
                                ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <span className="material-icons-round text-lg">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors
                                ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <span className="material-icons-round text-lg">view_list</span>
                        </button>
                    </div>

                    {/* Filter */}
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                        className="h-9 bg-black/20 border border-white/5 rounded-lg px-3 text-sm text-white 
                                 focus:outline-none focus:border-violet-500/30 appearance-none cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="document">Documents</option>
                        <option value="other">Other</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="h-9 bg-black/20 border border-white/5 rounded-lg px-3 text-sm text-white 
                                 focus:outline-none focus:border-violet-500/30 appearance-none cursor-pointer"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name A-Z</option>
                        <option value="size">Largest First</option>
                    </select>
                </div>
            </div>

            {/* Files Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3">
                            <span className="material-icons-round text-4xl text-slate-600 animate-pulse">folder</span>
                            <p className="text-sm text-slate-500">Loading files...</p>
                        </div>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="material-icons-round text-4xl text-slate-600">
                                    {searchQuery ? 'search_off' : 'folder_off'}
                                </span>
                            </div>
                            <div>
                                <p className="text-white font-medium">
                                    {searchQuery ? 'No files found' : 'No files yet'}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : 'Upload your first file to get started'
                                    }
                                </p>
                            </div>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 
                                             text-violet-300 hover:bg-violet-600/30 transition-colors text-sm"
                                >
                                    <span className="material-icons-round text-lg">upload</span>
                                    Upload File
                                </button>
                            )}
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredFiles.map(file => (
                            <FileCard
                                key={file.id}
                                file={file}
                                fileUrl={fileUrls[file.id]}
                                onSelect={setSelectedFile}
                                onReact={handleReact}
                                currentUserId={currentUser?.id}
                                viewMode="grid"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredFiles.map(file => (
                            <FileCard
                                key={file.id}
                                file={file}
                                fileUrl={fileUrls[file.id]}
                                onSelect={setSelectedFile}
                                onReact={handleReact}
                                currentUserId={currentUser?.id}
                                viewMode="list"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <FileUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={uploadFile}
                channels={channels}
                defaultChannelId={selectedChannelId && !isMyUploads ? selectedChannelId : undefined}
                uploadProgress={uploadProgress}
            />

            {/* File Detail View */}
            <FileDetailView
                file={selectedFile}
                fileUrl={selectedFileUrl}
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                onDelete={deleteFile}
                onReact={addReaction}
                onDownload={handleDownload}
                getComments={getComments}
                addComment={addComment}
                deleteComment={deleteComment}
                currentUserId={currentUser?.id}
            />
        </div>
    );
}
