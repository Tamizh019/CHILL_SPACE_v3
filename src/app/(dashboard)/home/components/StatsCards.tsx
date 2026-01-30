'use client';

export function StatsCards() {
    const focusStreak = 3;
    const todayMinutes = 45;
    const goalMinutes = 120;
    const progress = Math.min((todayMinutes / goalMinutes) * 100, 100);

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Focus Streak Card */}
            <div className="glass p-6 rounded-xl flex items-start gap-5 border border-white/5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full group-hover:bg-orange-500/10 transition-colors" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(249,115,22,0.2)] shrink-0">
                    🔥
                </div>
                <div className="flex-1">
                    <p className="text-2xl font-bold text-white tracking-tight font-heading">{focusStreak} Days</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1 mb-3">Focus Streak</p>
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    </div>
                </div>
            </div>

            {/* Time Focused Card */}
            <div className="glass p-6 rounded-xl flex items-start gap-5 border border-white/5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-violet-500/5 blur-[50px] rounded-full group-hover:bg-violet-500/10 transition-colors" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(139,92,246,0.2)] shrink-0">
                    ⏱️
                </div>
                <div className="flex-1">
                    <p className="text-2xl font-bold text-white tracking-tight font-heading">{todayMinutes} mins</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Time Focused</p>
                    <div className="w-full bg-white/10 h-1.5 mt-3 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-slate-500">Today</span>
                        <span className="text-[9px] text-slate-500">Goal: {goalMinutes}m</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
