'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronsRight } from 'lucide-react';

const navItems = [
    { icon: 'home', label: 'Home', href: '/home' },
    { icon: 'forum', label: 'Chat', href: '/chat' },
    { icon: 'code', label: 'Code', href: '/code' },
    { icon: 'sports_esports', label: 'Games', href: '/games' },
    { icon: 'timer', label: 'Focus', href: '/focus' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [isHoveringLogo, setIsHoveringLogo] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setIsOpen(false);
            } else {
                const stored = localStorage.getItem('sidebar_open');
                if (stored !== null) {
                    setIsOpen(JSON.parse(stored));
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (!isMobile) {
            localStorage.setItem('sidebar_open', JSON.stringify(newState));
        }
    };

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (!isMounted) return null;

    const sidebarVariants = {
        open: {
            width: 240,
            x: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        },
        closed: {
            width: isMobile ? 0 : 80,
            x: isMobile ? '-100%' : 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    } as any;

    return (
        <>
            {/* Mobile Toggle Button */}
            {isMobile && !isOpen && (
                <div className="fixed top-4 left-4 z-50">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-lg"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            )}

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={isOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
                className={`
                    h-screen bg-black/80 backdrop-blur-2xl border-r border-white/10 flex flex-col
                    ${isMobile ? 'fixed inset-y-0 left-0 z-50 overflow-hidden' : 'relative z-30'}
                `}
            >
                {/* 
                    Note: Removed global 'overflow-hidden' for Desktop so the tooltip can pop out.
                    We apply overflow handling carefully to children.
                */}
                <div className={`h-full flex flex-col p-4 transition-all duration-300 ${isOpen ? 'w-[240px]' : 'w-[80px] items-center'}`}>

                    {/* Header */}
                    <div className={`mb-8 flex items-center ${isOpen ? 'justify-between px-2' : 'justify-center relative'}`}>

                        {/* Logo Area */}
                        <div
                            onClick={() => !isOpen && setIsOpen(true)}
                            onMouseEnter={() => !isOpen && setIsHoveringLogo(true)}
                            onMouseLeave={() => setIsHoveringLogo(false)}
                            className={`flex items-center gap-3 cursor-pointer ${!isOpen ? 'group relative' : ''}`}
                        >
                            {/* Logo (when open) OR Animated Icon (when closed) */}
                            {isOpen ? (
                                <div className="relative w-8 h-8 flex-shrink-0">
                                    <Image
                                        src="/logo1.svg"
                                        alt="Logo"
                                        fill
                                        className="object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                    />
                                </div>
                            ) : (
                                <motion.div
                                    className="w-8 h-8 flex items-center justify-center"
                                    initial={false}
                                    animate={{ scale: isHoveringLogo ? 1.1 : 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AnimatePresence mode="wait">
                                        {isHoveringLogo ? (
                                            <motion.div
                                                key="icon"
                                                initial={{ opacity: 0, rotate: -90 }}
                                                animate={{ opacity: 1, rotate: 0 }}
                                                exit={{ opacity: 0, rotate: 90 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronsRight size={24} className="text-violet-400" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="logo"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="relative w-8 h-8"
                                            >
                                                <Image
                                                    src="/logo1.svg"
                                                    alt="Logo"
                                                    fill
                                                    className="object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* Text (only when open) */}
                            <AnimatePresence mode="wait">
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="font-bold text-lg tracking-tight text-white whitespace-nowrap"
                                    >
                                        Chill Space
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Tooltip (when closed and hovering) */}
                            {!isOpen && isHoveringLogo && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-violet-600 text-xs text-white rounded-lg opacity-100 whitespace-nowrap pointer-events-none shadow-lg z-50"
                                >
                                    Open Sidebar
                                </motion.div>
                            )}
                        </div>

                        {/* Close Button (only when open) */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors ml-2"
                                >
                                    <Menu size={20} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar w-full">
                        {isOpen && <div className="text-xs font-semibold text-slate-500 mb-2 px-4 uppercase tracking-wider">Menu</div>}

                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={!isOpen ? item.label : ''}
                                    className={`
                                        flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_-5px_rgba(139,92,246,0.4)]'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
                                        ${!isOpen ? 'justify-center' : ''}
                                    `}
                                >
                                    <span className={`material-icons-round text-xl flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                        {item.icon}
                                    </span>

                                    {isOpen && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}

                                    {isActive && isOpen && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sign Out Button */}
                    <div className={`mt-auto border-t border-white/10 pt-4 ${isOpen ? 'px-2' : ''}`}>
                        <button
                            onClick={() => setShowSignOutConfirm(true)}
                            title={!isOpen ? "Sign Out" : ""}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all group ${!isOpen ? 'justify-center' : ''}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-red-400 transition-colors flex-shrink-0">
                                <span className="material-icons-round text-sm">logout</span>
                            </div>
                            {isOpen && (
                                <div className="flex-1 text-left whitespace-nowrap overflow-hidden">
                                    <div className="text-sm font-medium text-slate-300 group-hover:text-red-400 transition-colors">Sign Out</div>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

                        <h3 className="text-xl font-semibold text-white mb-2">Sign Out?</h3>
                        <p className="text-slate-400 text-sm mb-6">Are you sure you want to log out?</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 border border-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
