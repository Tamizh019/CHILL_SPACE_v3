'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const navItems = [
    { icon: 'home', label: 'Home', href: '/home' },
    { icon: 'forum', label: 'Chat', href: '/chat' },
    { icon: 'code', label: 'Code', href: '/code' },
    { icon: 'sports_esports', label: 'Games', href: '/games' },
    { icon: 'person', label: 'Profile', href: '/profile' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 safe-area-pb">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-violet-500 rounded-b-full"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span
                                className={`material-icons-round text-2xl transition-colors ${isActive ? 'text-violet-400' : 'text-slate-500'
                                    }`}
                            >
                                {item.icon}
                            </span>
                            <span
                                className={`text-[10px] mt-0.5 font-medium transition-colors ${isActive ? 'text-violet-400' : 'text-slate-500'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
