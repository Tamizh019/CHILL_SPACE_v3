'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

import Image from 'next/image';

const navItems = [
    { icon: 'home', label: 'Home', href: '/home' },
    { icon: 'forum', label: 'Chat', href: '/chat' },
    { icon: 'code', label: 'Code', href: '/code' },
    { icon: 'palette', label: 'Canvas', href: '/canvas' },
    { icon: 'timer', label: 'Focus', href: '/focus' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <>
            <aside className="w-20 flex flex-col items-center py-6 border-r border-white/5 bg-black/30 backdrop-blur-xl z-30">
                {/* Logo */}
                <div className="mb-10">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <Image
                            src="/logo1.svg"
                            alt="Logo"
                            width={40}
                            height={40}
                            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-6 w-full">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center justify-center h-10 transition-colors ${isActive ? 'text-violet-400' : 'text-slate-500 hover:text-white'
                                    }`}
                            >
                                <span
                                    className={`material-icons-round text-2xl transition-transform group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''
                                        }`}
                                >
                                    {item.icon}
                                </span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-l-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Icons */}
                <div className="mt-auto flex flex-col gap-4">
                    <button
                        onClick={() => setShowSignOutConfirm(true)}
                        className="text-slate-500 hover:text-white transition-colors p-2 group relative"
                    >
                        <span className="material-icons-round text-2xl">logout</span>
                        <span className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

                        <h3 className="text-xl font-semibold text-white mb-2 relative z-10">Sign Out?</h3>
                        <p className="text-slate-400 text-sm mb-6 relative z-10">
                            Are you sure you want to log out of your session?
                        </p>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all shadow-[0_0_10px_rgba(248,113,113,0.1)]"
                            >
                                Yes, Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
