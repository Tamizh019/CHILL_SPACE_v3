'use client';

import { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

interface SpacesListProps {
    channels: Channel[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

// Helper to generate consistent UI props for channels based on their ID/Name
const getChannelStyles = (name: string) => {
    const styles = [
        { icon: 'tag', bg: 'bg-violet-500/20', color: 'text-violet-400' },
        { icon: 'campaign', bg: 'bg-white/5', color: 'text-slate-400' },
        { icon: 'code', bg: 'bg-blue-500/10', color: 'text-blue-400' },
        { icon: 'music_note', bg: 'bg-pink-500/10', color: 'text-pink-400' },
        { icon: 'school', bg: 'bg-orange-500/10', color: 'text-orange-400' },
        { icon: 'public', bg: 'bg-green-500/10', color: 'text-green-400' },
    ];
    // Simple hash to pick a style
    const index = name.length % styles.length;
    return styles[index];
};

export function SpacesList({ channels, selectedId, onSelect }: SpacesListProps) {
    // Group by category (currently all 'General' or defaults)
    const category = 'All Spaces';

    return (
        <div>
            <div className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-600 mt-4 mb-2 px-2">
                {category}
            </div>
            {channels.map(channel => {
                const isActive = selectedId === channel.id;
                // Use channel icon if available, otherwise fall back to hash-based selection
                const channelIcon = (channel as any).icon || getChannelStyles(channel.name || 'channel').icon;
                const style = getChannelStyles(channel.name || 'channel');

                return (
                    <div
                        key={channel.id}
                        onClick={() => onSelect(channel.id)}
                        className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isActive
                            ? 'bg-violet-500/10 border border-violet-500/20'
                            : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-lg ${style.bg} ${style.color} flex items-center justify-center`}>
                            <span className="material-icons-round text-lg">{channelIcon}</span>
                        </div>
                        <div className="flex-1">
                            <div className={`font-heading font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                {channel.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                {channel.description || 'No description'}
                            </div>
                        </div>
                    </div>
                );
            })}

            {channels.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-500 text-xs">
                    No spaces found.
                </div>
            )}
        </div>
    );
}
