'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { icon: 'home', label: 'Home', href: '/home' },
    { icon: 'forum', label: 'Chat', href: '/chat' },
    { icon: 'code', label: 'Code', href: '/code' },
    { icon: 'sports_esports', label: 'Games', href: '/games' },
    { icon: 'timer', label: 'Focus', href: '/focus' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isRestored, setIsRestored] = useState(false);

    // Load pinned state from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('sidebar_pinned');
        if (stored) {
            setIsPinned(JSON.parse(stored));
        }
        setIsRestored(true);
    }, []);

    const togglePin = () => {
        const newState = !isPinned;
        setIsPinned(newState);
        localStorage.setItem('sidebar_pinned', JSON.stringify(newState));

        // TODO: Sync to DB if 'settings' column exists
        // updateSettings({ sidebar_pinned: newState });
    };

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <>
            <motion.aside
                initial={{ width: 80 }}
                animate={{ width: isHovered || isPinned ? 240 : 80 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex flex-col items-start py-6 border-r border-white/5 bg-black/30 backdrop-blur-xl z-30 h-screen overflow-hidden relative"
            >
                {/* Logo & Pin Toggle */}
                <div className="mb-10 w-full px-5 flex items-center justify-between">
                    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <Image
                            src="/logo1.svg"
                            alt="Logo"
                            width={40}
                            height={40}
                            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        />
                    </div>

                    {/* Pin Toggle Button */}
                    <AnimatePresence>
                        {(isHovered || isPinned) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={togglePin}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPinned ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-slate-500 hover:text-white'
                                    }`}
                                title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                            >
                                <span className={`material-icons-round text-lg transition-transform ${isPinned ? 'rotate-45' : ''}`}>
                                    push_pin
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-4 w-full px-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center h-12 rounded-xl transition-colors duration-200 ${isActive
                                    ? 'bg-violet-500/10 text-violet-400'
                                    : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className="absolute left-0 w-14 h-full flex items-center justify-center flex-shrink-0">
                                    <span
                                        className={`material-icons-round text-2xl transition-transform group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''
                                            }`}
                                    >
                                        {item.icon}
                                    </span>
                                </div>

                                <AnimatePresence>
                                    {(isHovered || isPinned) && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2, delay: 0.05 }}
                                            className="ml-14 text-sm font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {/* Active Indicator */}
                                {isActive && !isHovered && !isPinned && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Icons */}
                <div className="mt-auto w-full px-3">
                    <button
                        onClick={() => setShowSignOutConfirm(true)}
                        className="group relative flex items-center h-12 w-full rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <div className="absolute left-0 w-14 h-full flex items-center justify-center flex-shrink-0">
                            <span className="material-icons-round text-2xl">logout</span>
                        </div>

                        <AnimatePresence>
                            {(isHovered || isPinned) && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2, delay: 0.05 }}
                                    className="ml-14 text-sm font-medium whitespace-nowrap overflow-hidden"
                                >
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

                        <h3 className="text-xl font-semibold text-white mb-2 relative z-10">
                            Sign Out?
                        </h3>
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
                                className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
