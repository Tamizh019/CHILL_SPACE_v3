'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { IconPicker } from './IconPicker';

type Channel = Database['public']['Tables']['channels']['Row'];

interface ChannelSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: Channel;
    onChannelDeleted: () => void;
    currentUserRole?: string | null;
}

export function ChannelSettingsModal({
    isOpen,
    onClose,
    channel,
    onChannelDeleted,
    currentUserRole
}: ChannelSettingsModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit mode states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState(channel.name || '');
    const [editDescription, setEditDescription] = useState(channel.description || '');
    const [editIcon, setEditIcon] = useState(channel.icon || 'tag');
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();

    // Update edit states when channel changes
    useEffect(() => {
        setEditName(channel.name || '');
        setEditDescription(channel.description || '');
        setEditIcon(channel.icon || 'tag');
        setIsEditMode(false);
    }, [channel]);

    // Protect General channel from deletion
    const isProtectedChannel = channel.name?.toLowerCase() === 'general';
    const canDelete = currentUserRole && ['admin', 'moderator', 'owner'].includes(currentUserRole) && !isProtectedChannel;
    const canEdit = currentUserRole && ['admin', 'moderator', 'owner'].includes(currentUserRole);

    const handleSave = async () => {
        if (!editName.trim()) {
            setError('Channel name cannot be empty');
            return;
        }

        setIsSaving(true);
        setError(null);

        const updateData = {
            name: editName.trim(),
            description: editDescription.trim() || null,
            icon: editIcon
        };

        try {
            const { data, error: updateError } = await supabase
                .from('channels')
                .update(updateData)
                .eq('id', channel.id)
                .select();

            if (updateError) throw updateError;

            if (!data || data.length === 0) {
                throw new Error('Update failed - no rows affected. Check your permissions.');
            }

            setIsEditMode(false);
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Failed to update channel');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!canDelete || isProtectedChannel) return;

        setIsDeleting(true);
        setError(null);

        try {
            // Delete all messages in the channel first
            await supabase
                .from('messages')
                .delete()
                .eq('channel_id', channel.id);

            // Delete all files in the channel
            await supabase
                .from('files')
                .delete()
                .eq('channel_id', channel.id);

            // Delete the channel
            const { error: deleteError } = await supabase
                .from('channels')
                .delete()
                .eq('id', channel.id);

            if (deleteError) throw deleteError;

            onChannelDeleted();
            onClose();
        } catch (err: any) {
            console.error('Error deleting channel:', err);
            setError(err.message || 'Failed to delete channel');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-card">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h3 className="font-heading font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-slate-400">settings</span>
                        Channel Settings
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Edit Mode Toggle */}
                    {canEdit && !isEditMode && (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl 
                                     bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 
                                     text-violet-300 hover:text-white transition-all text-sm font-medium"
                        >
                            <span className="material-icons-round text-sm">edit</span>
                            Edit Channel
                        </button>
                    )}

                    {/* Channel Info */}
                    <div className="space-y-4">
                        {/* Channel Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Channel Name
                            </label>
                            {isEditMode ? (
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">#</span>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 
                                                 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                    />
                                </div>
                            ) : (
                                <div className="h-11 bg-black/20 border border-white/10 rounded-xl px-4 flex items-center text-white">
                                    <span className="text-slate-500 mr-1">#</span>
                                    {channel.name}
                                </div>
                            )}
                        </div>

                        {/* Icon Picker - Only in edit mode */}
                        {isEditMode && (
                            <IconPicker
                                selectedIcon={editIcon}
                                onSelectIcon={setEditIcon}
                            />
                        )}

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Description
                            </label>
                            {isEditMode ? (
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="What is this channel about?"
                                    rows={3}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 
                                             text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 
                                             transition-colors resize-none"
                                />
                            ) : channel.description ? (
                                <div className="bg-black/20 border border-white/10 rounded-xl p-3 text-slate-300 text-sm">
                                    {channel.description}
                                </div>
                            ) : (
                                <div className="bg-black/20 border border-white/10 rounded-xl p-3 text-slate-500 text-sm italic">
                                    No description
                                </div>
                            )}
                        </div>

                        {!isEditMode && (
                            <div className="text-xs text-slate-500">
                                Created: {new Date(channel.created_at || '').toLocaleDateString()}
                            </div>
                        )}

                        {/* Save/Cancel Buttons - Only in edit mode */}
                        {isEditMode && (
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setEditName(channel.name || '');
                                        setEditDescription(channel.description || '');
                                        setEditIcon((channel as any).icon || 'tag');
                                        setError(null);
                                    }}
                                    className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 
                                             text-slate-300 font-medium transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !editName.trim()}
                                    className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             text-white font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons-round text-sm">save</span>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && !showDeleteConfirm && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                                <span className="material-icons-round text-base">error_outline</span>
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    {isProtectedChannel ? (
                        <div className="border-t border-white/5 pt-6">
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                                <h4 className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                                    <span className="material-icons-round text-sm">verified_user</span>
                                    Protected Channel
                                </h4>
                                <p className="text-slate-400 text-sm">
                                    The #General channel is protected and cannot be deleted.
                                    It serves as the default community space for all members.
                                </p>
                            </div>
                        </div>
                    ) : canDelete && (
                        <div className="border-t border-white/5 pt-6">
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                                <h4 className="text-red-400 font-semibold flex items-center gap-2 mb-2">
                                    <span className="material-icons-round text-sm">warning</span>
                                    Danger Zone
                                </h4>
                                <p className="text-slate-400 text-sm mb-4">
                                    Deleting this channel will permanently remove all messages and files.
                                    This action cannot be undone.
                                </p>

                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 
                                                 border border-red-500/30 text-red-400 font-medium 
                                                 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons-round text-sm">delete_forever</span>
                                        Delete Channel
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-red-300 text-sm font-medium text-center">
                                            Are you sure? This cannot be undone!
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 h-10 rounded-lg bg-white/5 hover:bg-white/10 
                                                         text-slate-300 font-medium transition-colors"
                                                disabled={isDeleting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-500 
                                                         disabled:opacity-50 disabled:cursor-not-allowed
                                                         text-white font-medium transition-colors 
                                                         flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? (
                                                    <>
                                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    'Yes, Delete'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-black/20">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 
                                 text-slate-300 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
