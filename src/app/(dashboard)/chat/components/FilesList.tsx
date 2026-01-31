'use client';

import { useState, useEffect, useMemo } from 'react';
import { Database } from '@/types/supabase';
import { createClient } from '@/utils/supabase/client';

type Channel = Database['public']['Tables']['channels']['Row'];

interface FilesListProps {
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string | null) => void;
    channels: Channel[];
    fileCounts?: Record<string, number>;
}

export function FilesList({
    selectedChannelId,
    onSelectChannel,
    channels,
    fileCounts = {}
}: FilesListProps) {
    const [myUploadCount, setMyUploadCount] = useState(0);
    const supabase = useMemo(() => createClient(), []);

    // Fetch count of user's uploads
    useEffect(() => {
        async function fetchMyUploads() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { count } = await supabase
                .from('files')
                .select('*', { count: 'exact', head: true })
                .eq('uploader_id', user.id);

            setMyUploadCount(count || 0);
        }
        fetchMyUploads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalFiles = Object.values(fileCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="space-y-1">
            {/* All Files */}
            <button
                onClick={() => onSelectChannel(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${selectedChannelId === null
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${selectedChannelId === null ? 'bg-violet-500/30' : 'bg-white/5'}`}>
                    <span className="material-icons-round text-lg">folder</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">All Files</p>
                    <p className="text-[10px] text-slate-500">
                        {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
                    </p>
                </div>
            </button>

            {/* Divider */}
            <div className="py-2">
                <div className="h-px bg-white/5" />
            </div>

            {/* Channels Section Header */}
            <div className="px-3 py-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    By Channel
                </p>
            </div>

            {/* Channel folders */}
            {channels.map(channel => {
                const count = fileCounts[channel.id] || 0;
                const isSelected = selectedChannelId === channel.id;

                return (
                    <button
                        key={channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all
                            ${isSelected
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                : 'hover:bg-white/5 text-slate-400 border border-transparent'
                            }`}
                    >
                        <span className={`material-icons-round text-lg ${isSelected ? 'text-violet-400' : 'text-slate-500'}`}>
                            {count > 0 ? 'folder' : 'folder_open'}
                        </span>
                        <span className="flex-1 text-sm truncate">#{channel.name}</span>
                        {count > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                                ${isSelected ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-slate-500'}`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}

            {/* Divider */}
            <div className="py-2">
                <div className="h-px bg-white/5" />
            </div>

            {/* My Uploads */}
            <button
                onClick={() => onSelectChannel('my-uploads')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${selectedChannelId === 'my-uploads'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${selectedChannelId === 'my-uploads' ? 'bg-violet-500/30' : 'bg-white/5'}`}>
                    <span className="material-icons-round text-lg">cloud_upload</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">My Uploads</p>
                    <p className="text-[10px] text-slate-500">
                        {myUploadCount} {myUploadCount === 1 ? 'file' : 'files'}
                    </p>
                </div>
            </button>
        </div>
    );
}
