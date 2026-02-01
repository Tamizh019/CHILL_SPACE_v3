'use client';

import { useState } from 'react';

const statuses = [
    { id: 'focusing', label: 'Focusing', color: 'bg-green-500', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.6)]', animate: true },
    { id: 'chilling', label: 'Chilling', color: 'bg-yellow-500', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.8)]' },
    { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.8)]' },
];

export function StatusPills() {
    const [currentStatus, setCurrentStatus] = useState('focusing');

    return (
        <div className="grid grid-cols-3 gap-4">
            {statuses.map((status) => (
                <button
                    key={status.id}
                    onClick={() => setCurrentStatus(status.id)}
                    className={`glass p-4 rounded-xl flex items-center justify-center gap-3 transition-all group ${currentStatus === status.id
                            ? 'ring-1 ring-white/10 bg-white/5'
                            : 'hover:bg-white/5 border-white/5'
                        }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${status.color} ${status.glow} ${status.animate && currentStatus === status.id ? 'animate-pulse' : ''
                            }`}
                    />
                    <span className={`text-sm font-medium transition-colors ${currentStatus === status.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}>
                        {status.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
