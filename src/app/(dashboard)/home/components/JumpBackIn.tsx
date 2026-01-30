'use client';

const recentItems = [
    {
        id: 1,
        title: 'Backend API',
        subtitle: 'Code File',
        icon: 'code',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
        timeColor: 'text-blue-300/60 bg-blue-500/10',
        timeAgo: '2h ago',
    },
    {
        id: 2,
        title: 'UI Mockups',
        subtitle: 'Canvas',
        icon: 'brush',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        timeColor: 'text-purple-300/60 bg-purple-500/10',
        timeAgo: '5h ago',
    },
    {
        id: 3,
        title: 'Lofi Lounge',
        subtitle: 'Room • 3 Active',
        icon: 'music_note',
        iconBg: 'bg-pink-500/10',
        iconColor: 'text-pink-400',
        timeColor: 'text-pink-300/60 bg-pink-500/10',
        timeAgo: 'Now',
        isLive: true,
    },
];

export function JumpBackIn() {
    return (
        <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1 font-heading">
                Jump Back In
            </h3>
            <div className="grid grid-cols-3 gap-4">
                {recentItems.map((item) => (
                    <div
                        key={item.id}
                        className="glass-card p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-1 hover:bg-white/[0.04] duration-300 border border-white/5 hover:border-violet-500/30"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <span className={`material-icons-round ${item.iconColor}`}>{item.icon}</span>
                            </div>
                            <span className={`text-[10px] font-mono font-medium ${item.timeColor} px-2 py-1 rounded`}>
                                {item.timeAgo}
                            </span>
                        </div>
                        <div>
                            <p className="text-base font-medium text-white group-hover:text-violet-400 transition-colors">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
