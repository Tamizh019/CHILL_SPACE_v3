'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { IconPicker } from './IconPicker';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChannelCreated: () => void;
    currentUserId: string;
}

export function CreateChannelModal({
    isOpen,
    onClose,
    onChannelCreated,
    currentUserId
}: CreateChannelModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('tag');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Check if channel already exists
            const { data: existing } = await supabase
                .from('channels')
                .select('id')
                .ilike('name', name.trim())
                .single();

            if (existing) {
                throw new Error('Channel name already exists');
            }

            const { error: insertError } = await supabase
                .from('channels')
                .insert({
                    name: name.trim(),
                    description: description.trim() || null,
                    icon: selectedIcon,
                    created_by: currentUserId
                });

            if (insertError) throw insertError;

            onChannelCreated();
            onClose();
            setName('');
            setDescription('');
            setSelectedIcon('tag');
        } catch (err: any) {
            console.error('Error creating channel:', err);
            setError(err.message || 'Failed to create channel');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-card">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h3 className="font-heading font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-violet-400">add_circle</span>
                        Create New Channel
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Channel Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 ml-1">
                            CHANNEL NAME
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">#</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="new-channel"
                                className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 
                                         text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 
                                         transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Icon Picker */}
                    <IconPicker
                        selectedIcon={selectedIcon}
                        onSelectIcon={setSelectedIcon}
                    />

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 ml-1">
                            DESCRIPTION & TOPIC
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this channel about?"
                            rows={3}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 
                                     text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 
                                     transition-colors resize-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                            <span className="material-icons-round text-base">error_outline</span>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed
                                     text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Create Channel
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
