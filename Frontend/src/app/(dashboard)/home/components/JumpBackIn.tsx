'use client';

import { useRecentActivity, RecentItem } from '@/context/RecentActivityContext';
import { useRouter } from 'next/navigation';

export function JumpBackIn() {
    const { recentItems } = useRecentActivity();
    const router = useRouter();

    const formatTimeAgo = (timestamp: number) => {
        const diff = Math.floor((Date.now() - timestamp) / 60000); // minutes
        if (diff < 1) return 'Now';
        if (diff < 60) return `${diff}m ago`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    // Helper to get colors based on icon type
    const getColors = (icon: string) => {
        switch (icon) {
            case 'code': case 'work': return { bg: 'bg-blue-500/10', text: 'text-blue-400', time: 'text-blue-300/60 bg-blue-500/10' };
            case 'brush': return { bg: 'bg-purple-500/10', text: 'text-purple-400', time: 'text-purple-300/60 bg-purple-500/10' };
            case 'music_note': return { bg: 'bg-pink-500/10', text: 'text-pink-400', time: 'text-pink-300/60 bg-pink-500/10' };
            case 'sports_esports': return { bg: 'bg-orange-500/10', text: 'text-orange-400', time: 'text-orange-300/60 bg-orange-500/10' };
            default: return { bg: 'bg-slate-500/10', text: 'text-slate-400', time: 'text-slate-300/60 bg-slate-500/10' };
        }
    };

    if (recentItems.length === 0) {
        return (
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4 pl-1 font-heading">
                    Jump Back In
                </h3>
                <div className="glass p-6 md:p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center opacity-60">
                    <span className="material-icons-round text-3xl md:text-4xl text-slate-600 mb-2">history</span>
                    <p className="text-sm text-slate-400">Your recent activity will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4 pl-1 font-heading">
                Jump Back In
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {recentItems.map((item) => {
                    const colors = getColors(item.icon);
                    return (
                        <div
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className="glass-card p-3 md:p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-1 hover:bg-white/[0.04] duration-300 border border-white/5 hover:border-violet-500/30"
                        >
                            <div className="flex items-start justify-between mb-3 md:mb-4">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <span className={`material-icons-round text-lg md:text-base ${colors.text}`}>{item.icon}</span>
                                </div>
                                <span className={`text-[9px] md:text-[10px] font-mono font-medium ${colors.time} px-1.5 md:px-2 py-0.5 md:py-1 rounded`}>
                                    {formatTimeAgo(item.timestamp)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm md:text-base font-medium text-white group-hover:text-violet-400 transition-colors truncate">{item.title}</p>
                                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1 truncate">{item.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
