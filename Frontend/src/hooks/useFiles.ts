'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { generateStoragePath } from '@/utils/fileUtils';

// Types
export interface FileRecord {
    id: string;
    uploader_id: string;
    channel_id: string | null;
    display_name: string;
    original_filename: string;
    description: string | null;
    file_type: string;
    file_size: number;
    storage_path: string;
    thumbnail_path: string | null;
    download_count: number;
    created_at: string;
    updated_at: string;
    // Joined data
    uploader?: {
        id: string;
        username: string | null;
        avatar_url: string | null;
    };
    channel?: {
        id: string;
        name: string;
    };
    reactions?: FileReaction[];
    comments?: FileComment[];
    _count?: {
        comments: number;
        reactions: number;
    };
}

export interface FileComment {
    id: string;
    file_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        id: string;
        username: string | null;
        avatar_url: string | null;
    };
}

export interface FileReaction {
    emoji: string;
    count: number;
    userIds: string[];
    usernames: string[];
}

export interface FileMetadata {
    displayName: string;
    description?: string;
    channelId: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

const STORAGE_BUCKET = 'space-files-v3';

export function useFiles(channelId?: string | null) {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [allFiles, setAllFiles] = useState<FileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Memoize the supabase client to prevent recreation on every render
    const supabase = useMemo(() => createClient(), []);

    // Fetch files (all or by channel)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Using 'any' cast because 'files' table may not be in generated types yet
            // After running: npx supabase gen types typescript, remove the cast
            const client = supabase as any;
            let query = client
                .from('files')
                .select(`
                    *,
                    uploader:users!uploader_id(id, username, avatar_url),
                    channel:channels!channel_id(id, name)
                `)
                .order('created_at', { ascending: false });

            if (channelId) {
                query = query.eq('channel_id', channelId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Fetch reaction counts for each file
            const filesWithReactions = await Promise.all(
                (data || []).map(async (file: any) => {
                    const { data: reactions } = await client
                        .from('file_reactions')
                        .select('emoji, user_id, users!user_id(username)')
                        .eq('file_id', file.id);

                    // Group reactions by emoji
                    const reactionMap = new Map<string, { userIds: string[]; usernames: string[] }>();
                    reactions?.forEach((r: any) => {
                        if (!reactionMap.has(r.emoji)) {
                            reactionMap.set(r.emoji, { userIds: [], usernames: [] });
                        }
                        const group = reactionMap.get(r.emoji)!;
                        group.userIds.push(r.user_id);
                        group.usernames.push(r.users?.username || 'Unknown');
                    });

                    const groupedReactions: FileReaction[] = Array.from(reactionMap.entries()).map(
                        ([emoji, data]) => ({
                            emoji,
                            count: data.userIds.length,
                            userIds: data.userIds,
                            usernames: data.usernames,
                        })
                    );

                    // Get comment count
                    const { count: commentCount } = await client
                        .from('file_comments')
                        .select('*', { count: 'exact', head: true })
                        .eq('file_id', file.id);

                    return {
                        ...file,
                        reactions: groupedReactions,
                        _count: {
                            comments: commentCount || 0,
                            reactions: reactions?.length || 0,
                        },
                    };
                })
            );

            if (channelId) {
                setFiles(filesWithReactions);
            } else {
                setAllFiles(filesWithReactions);
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching files:', err);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelId]);

    // Upload a file
    const uploadFile = async (
        file: File,
        metadata: FileMetadata
    ): Promise<FileRecord | null> => {
        setError(null);
        setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Generate storage path
            const storagePath = generateStoragePath(user.id, file.name);

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Simulate progress (Supabase doesn't provide progress events)
            setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });

            const client = supabase as any;

            // Create database record
            const { data: fileRecord, error: dbError } = await client
                .from('files')
                .insert({
                    uploader_id: user.id,
                    channel_id: metadata.channelId,
                    display_name: metadata.displayName,
                    original_filename: file.name,
                    description: metadata.description || null,
                    file_type: file.type,
                    file_size: file.size,
                    storage_path: storagePath,
                })
                .select(`
                    *,
                    uploader:users!uploader_id(id, username, avatar_url),
                    channel:channels!channel_id(id, name)
                `)
                .single();

            if (dbError) throw dbError;

            // Add to local state
            const newFile = { ...fileRecord, reactions: [], _count: { comments: 0, reactions: 0 } };
            setFiles(prev => [newFile, ...prev]);
            setAllFiles(prev => [newFile, ...prev]);

            setUploadProgress(null);
            return newFile;
        } catch (err: any) {
            setError(err.message);
            setUploadProgress(null);
            console.error('Error uploading file:', err);
            return null;
        }
    };

    // Delete a file
    const deleteFile = async (fileId: string): Promise<boolean> => {
        try {
            const client = supabase as any;

            // Get file record first
            const { data: file } = await client
                .from('files')
                .select('storage_path')
                .eq('id', fileId)
                .single();

            if (file) {
                // Delete from storage
                await supabase.storage
                    .from(STORAGE_BUCKET)
                    .remove([file.storage_path]);
            }

            // Delete from database
            const { error } = await client
                .from('files')
                .delete()
                .eq('id', fileId);

            if (error) throw error;

            // Update local state
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setAllFiles(prev => prev.filter(f => f.id !== fileId));

            return true;
        } catch (err: any) {
            setError(err.message);
            console.error('Error deleting file:', err);
            return false;
        }
    };

    // Update file metadata
    const updateFile = async (
        fileId: string,
        updates: Partial<Pick<FileMetadata, 'displayName' | 'description'>>
    ): Promise<boolean> => {
        try {
            const updateData: any = { updated_at: new Date().toISOString() };
            if (updates.displayName) updateData.display_name = updates.displayName;
            if (updates.description !== undefined) updateData.description = updates.description;

            const client = supabase as any;
            const { error } = await client
                .from('files')
                .update(updateData)
                .eq('id', fileId);

            if (error) throw error;

            // Update local state
            const updateLocal = (files: FileRecord[]) =>
                files.map(f => f.id === fileId ? { ...f, ...updateData } : f);

            setFiles(updateLocal);
            setAllFiles(updateLocal);

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    // Get signed URL for file download/preview
    const getFileUrl = useCallback(async (storagePath: string): Promise<string | null> => {
        try {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(storagePath, 3600); // 1 hour expiry

            if (error) throw error;
            return data.signedUrl;
        } catch (err: any) {
            console.error('Error getting file URL:', err);
            return null;
        }
    }, [supabase]);

    // Add reaction to file
    const addReaction = async (fileId: string, emoji: string): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const client = supabase as any;

            // Check if already reacted
            const { data: existing } = await client
                .from('file_reactions')
                .select('id')
                .eq('file_id', fileId)
                .eq('user_id', user.id)
                .eq('emoji', emoji)
                .single();

            if (existing) {
                // Remove reaction
                await client
                    .from('file_reactions')
                    .delete()
                    .eq('id', existing.id);
            } else {
                // Add reaction
                await client
                    .from('file_reactions')
                    .insert({ file_id: fileId, user_id: user.id, emoji });
            }

            // Refresh files to get updated reactions
            await fetchFiles();
            return true;
        } catch (err: any) {
            console.error('Error toggling reaction:', err);
            return false;
        }
    };

    // Get comments for a file
    const getComments = async (fileId: string): Promise<FileComment[]> => {
        try {
            const client = supabase as any;
            const { data, error } = await client
                .from('file_comments')
                .select(`
                    *,
                    user:users!user_id(id, username, avatar_url)
                `)
                .eq('file_id', fileId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err: any) {
            console.error('Error fetching comments:', err);
            return [];
        }
    };

    // Add comment to file
    const addComment = async (fileId: string, content: string): Promise<FileComment | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const client = supabase as any;
            const { data, error } = await client
                .from('file_comments')
                .insert({ file_id: fileId, user_id: user.id, content })
                .select(`
                    *,
                    user:users!user_id(id, username, avatar_url)
                `)
                .single();

            if (error) throw error;

            // Update local count
            const updateCount = (files: FileRecord[]) =>
                files.map(f => f.id === fileId
                    ? { ...f, _count: { ...f._count, comments: (f._count?.comments || 0) + 1, reactions: f._count?.reactions || 0 } }
                    : f
                );
            setFiles(updateCount);
            setAllFiles(updateCount);

            return data;
        } catch (err: any) {
            console.error('Error adding comment:', err);
            return null;
        }
    };

    // Delete comment
    const deleteComment = async (commentId: string, fileId: string): Promise<boolean> => {
        try {
            const client = supabase as any;
            const { error } = await client
                .from('file_comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            // Update local count
            const updateCount = (files: FileRecord[]) =>
                files.map(f => f.id === fileId
                    ? { ...f, _count: { ...f._count, comments: Math.max((f._count?.comments || 1) - 1, 0), reactions: f._count?.reactions || 0 } }
                    : f
                );
            setFiles(updateCount);
            setAllFiles(updateCount);

            return true;
        } catch (err: any) {
            console.error('Error deleting comment:', err);
            return false;
        }
    };

    // Increment download count
    const incrementDownload = async (fileId: string): Promise<void> => {
        try {
            const client = supabase as any;
            const { data: file } = await client
                .from('files')
                .select('download_count')
                .eq('id', fileId)
                .single();

            if (file) {
                await client
                    .from('files')
                    .update({ download_count: (file.download_count || 0) + 1 })
                    .eq('id', fileId);
            }
        } catch (err) {
            console.error('Error incrementing download:', err);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Real-time subscription for file changes
    useEffect(() => {
        const channel = supabase
            .channel('files-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'files' },
                () => {
                    fetchFiles();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchFiles]);

    return {
        files: channelId ? files : allFiles,
        isLoading,
        uploadProgress,
        error,
        uploadFile,
        deleteFile,
        updateFile,
        getFileUrl,
        addReaction,
        getComments,
        addComment,
        deleteComment,
        incrementDownload,
        refetch: fetchFiles,
    };
}
