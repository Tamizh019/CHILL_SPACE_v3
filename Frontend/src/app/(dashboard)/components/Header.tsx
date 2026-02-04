'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { SearchModal } from './SearchModal';

const statuses = [
    { id: 'focusing', label: 'Focusing', color: 'bg-green-500', borderColor: 'border-green-500/30' },
    { id: 'chilling', label: 'Chilling', color: 'bg-yellow-500', borderColor: 'border-yellow-500/30' },
    { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500', borderColor: 'border-red-500/30' },
];

export function Header() {
    const [currentStatus, setCurrentStatus] = useState('focusing');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    // Added 'id' to userInfo type
    const [userInfo, setUserInfo] = useState<{ id: string; username: string | null; avatar_url: string | null } | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Header: Error fetching user profile:', error.message);
                    setUserInfo({ id: user.id, username: user.email?.split('@')[0] || 'User', avatar_url: null });
                } else if (profile) {
                    setUserInfo({ id: user.id, ...profile });
                } else {
                    // Fallback using email if profile missing
                    setUserInfo({ id: user.id, username: user.email?.split('@')[0] || 'User', avatar_url: null });
                }
            }
        };
        fetchUser();
    }, []);

    // Keyboard shortcut for search (⌘K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearchModal(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const activeStatus = statuses.find((s) => s.id === currentStatus)!;

    // Determine which pages should show search/status
    const showSearchAndStatus = pathname === '/home' || pathname === '/chat';

    return (
        <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/5 dark:bg-black/20 z-20 relative">
            {/* Left Side - App Title on mobile, Search on desktop */}
            <div className="flex items-center flex-1">
                {/* Mobile: Show app title */}
                <div className="md:hidden flex items-center gap-2">
                    <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                        Chill Space
                    </span>
                </div>

                {/* Desktop: Show search */}
                {showSearchAndStatus && (
                    <div
                        onClick={() => setShowSearchModal(true)}
                        className="hidden md:block relative w-full max-w-xl group cursor-pointer"
                    >
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-hover:text-violet-400 transition-colors">
                            search
                        </span>
                        <div className="w-full bg-white/5 hover:bg-white/10 border-none rounded-lg pl-10 pr-12 py-2 text-sm text-slate-600 transition-all">
                            Search conversations, projects...
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-slate-500 font-mono bg-white/5">
                            ⌘K
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Status Dropdown - Desktop Only */}
                {showSearchAndStatus && (
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <span className={`w-2 h-2 rounded-full ${activeStatus.color}`} />
                                <span className="text-sm text-slate-200">{activeStatus.label}</span>
                                <span className="material-icons-round text-slate-500 text-sm">expand_more</span>
                            </button>

                            {showStatusDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                    {statuses.map((status) => (
                                        <button
                                            key={status.id}
                                            onClick={() => {
                                                setCurrentStatus(status.id);
                                                setShowStatusDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${currentStatus === status.id ? 'text-white bg-white/[0.03]' : 'text-slate-400'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                            {status.label}
                                            {currentStatus === status.id && (
                                                <span className="material-icons-round text-violet-400 text-sm ml-auto">check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Separator */}
                        <div className="h-6 w-px bg-white/10" />
                    </div>
                )}

                {/* Notifications */}
                <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                    <span className="material-icons-round text-xl md:text-2xl">notifications</span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
                </button>

                {/* User Profile - Hidden on mobile (accessible via bottom nav) */}
                <div
                    className="hidden md:flex items-center gap-3 pl-2 cursor-pointer group"
                    onClick={() => router.push('/profile')}
                >
                    {userInfo?.avatar_url ? (
                        <img
                            src={userInfo.avatar_url}
                            alt={userInfo.username || 'User'}
                            className="w-9 h-9 rounded-full object-cover border border-white/10 shadow-[0_0_10px_rgba(139,92,246,0.3)] group-hover:border-violet-500/50 transition-colors"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium border border-white/10 shadow-[0_0_10px_rgba(139,92,246,0.3)] group-hover:border-violet-500/50 transition-colors">
                            {userInfo?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Modal */}
            <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
        </header>
    );
}
