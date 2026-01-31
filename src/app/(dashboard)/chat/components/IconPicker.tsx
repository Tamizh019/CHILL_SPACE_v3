'use client';

interface IconPickerProps {
    selectedIcon: string;
    onSelectIcon: (icon: string) => void;
}

const ICON_OPTIONS = [
    // General
    { name: 'tag', label: 'Tag', color: 'text-violet-400', bg: 'bg-violet-500/20' },
    { name: 'campaign', label: 'Announcement', color: 'text-slate-400', bg: 'bg-white/5' },
    { name: 'forum', label: 'Forum', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'chat', label: 'Chat', color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'groups', label: 'Groups', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { name: 'diversity_3', label: 'Community', color: 'text-purple-400', bg: 'bg-purple-500/10' },

    // Tech
    { name: 'code', label: 'Code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'terminal', label: 'Terminal', color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'bug_report', label: 'Bug Report', color: 'text-red-400', bg: 'bg-red-500/10' },
    { name: 'science', label: 'Science', color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { name: 'psychology', label: 'AI/ML', color: 'text-pink-400', bg: 'bg-pink-500/10' },

    // Creative
    { name: 'palette', label: 'Art', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'music_note', label: 'Music', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'movie', label: 'Movies', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'photo_camera', label: 'Photography', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'brush', label: 'Design', color: 'text-violet-400', bg: 'bg-violet-500/10' },

    // Learning
    { name: 'school', label: 'Education', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { name: 'menu_book', label: 'Books', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'lightbulb', label: 'Ideas', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { name: 'quiz', label: 'Quiz', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'calculate', label: 'Math', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },

    // Fun
    { name: 'sports_esports', label: 'Gaming', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'celebration', label: 'Events', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'emoji_events', label: 'Achievements', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { name: 'rocket_launch', label: 'Launch', color: 'text-orange-400', bg: 'bg-orange-500/10' },

    // Other
    { name: 'public', label: 'Global', color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'explore', label: 'Explore', color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { name: 'star', label: 'Featured', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { name: 'favorite', label: 'Favorite', color: 'text-red-400', bg: 'bg-red-500/10' },
    { name: 'workspace_premium', label: 'Premium', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

export function IconPicker({ selectedIcon, onSelectIcon }: IconPickerProps) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 ml-1">
                CHANNEL ICON
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-black/20 border border-white/10 rounded-xl max-h-[200px] overflow-y-auto">
                {ICON_OPTIONS.map((icon) => (
                    <button
                        key={icon.name}
                        type="button"
                        onClick={() => onSelectIcon(icon.name)}
                        className={`w-full aspect-square rounded-lg ${icon.bg} ${icon.color} 
                            flex items-center justify-center transition-all hover:scale-110
                            ${selectedIcon === icon.name
                                ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#1a1a1a] scale-105'
                                : 'hover:bg-opacity-80'
                            }`}
                        title={icon.label}
                    >
                        <span className="material-icons-round text-lg">{icon.name}</span>
                    </button>
                ))}
            </div>
            <p className="text-xs text-slate-500 ml-1">
                Selected: <span className="text-violet-400 font-medium">
                    {ICON_OPTIONS.find(i => i.name === selectedIcon)?.label || 'Tag'}
                </span>
            </p>
        </div>
    );
}
