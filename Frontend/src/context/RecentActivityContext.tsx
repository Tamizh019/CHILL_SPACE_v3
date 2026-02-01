'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface RecentItem {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    path: string;
    timestamp: number;
}

// Sidebar Data Interfaces
export interface ActivityItem {
    id: string;
    type: 'online' | 'upload' | 'game_score';
    userId: string;
    username: string;
    avatar: string | null;
    timestamp: Date;
    details?: string;
    subDetails?: string;
    link?: string;
}

export interface RecentChat {
    id: string;
    name: string;
    avatar: string | null;
    lastMessage: string;
    sentAt: Date;
    isOnline: boolean;
    lastSeen: Date | null;
}

export interface LevelData {
    level: number;
    currentXP: number;
    nextXP: number;
}

interface RecentActivityContextType {
    recentItems: RecentItem[];
    // Sidebar Cache
    sidebarData: {
        activities: ActivityItem[];
        recentChats: RecentChat[];
        levelData: LevelData;
        lastFetched: number;
    };
    updateSidebarData: (data: Partial<{ activities: ActivityItem[]; recentChats: RecentChat[]; levelData: LevelData }>) => void;
}

const RecentActivityContext = createContext<RecentActivityContextType | undefined>(undefined);

// Helper to get nice names for routes
const getRouteInfo = (path: string): { title: string; subtitle: string; icon: string } | null => {
    if (path.startsWith('/chat')) return { title: 'Chat Room', subtitle: 'Messaging', icon: 'chat' };
    if (path.startsWith('/work')) return { title: 'Workspace', subtitle: 'Productivity', icon: 'work' };
    if (path.startsWith('/music')) return { title: 'Lofi Player', subtitle: 'Music', icon: 'music_note' };
    if (path.startsWith('/games')) return { title: 'Games Hub', subtitle: 'Mini-Games', icon: 'sports_esports' };
    if (path.startsWith('/profile')) return { title: 'Profile', subtitle: 'Settings', icon: 'person' };
    return null;
};

export function RecentActivityProvider({ children }: { children: React.ReactNode }) {
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const pathname = usePathname();

    // Singleton Cache State for Right Sidebar
    const [sidebarData, setSidebarData] = useState<{
        activities: ActivityItem[];
        recentChats: RecentChat[];
        levelData: LevelData;
        lastFetched: number;
    }>({
        activities: [],
        recentChats: [],
        levelData: { level: 1, currentXP: 0, nextXP: 1000 },
        lastFetched: 0
    });

    const updateSidebarData = (data: Partial<{ activities: ActivityItem[]; recentChats: RecentChat[]; levelData: LevelData }>) => {
        setSidebarData(prev => ({
            ...prev,
            ...data,
            lastFetched: Date.now()
        }));
    };

    useEffect(() => {
        // Load from local storage
        const stored = localStorage.getItem('chill_recent_activity');
        if (stored) {
            try {
                setRecentItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse recent activity", e);
            }
        }
    }, []);

    useEffect(() => {
        if (!pathname || pathname === '/home' || pathname === '/') return;

        const info = getRouteInfo(pathname);
        if (!info) return;

        setRecentItems(prev => {
            // Remove existing entry for this path to avoid duplicates
            const filtered = prev.filter(item => !item.path.startsWith(pathname) && !pathname.startsWith(item.path));

            const newItem: RecentItem = {
                id: pathname,
                path: pathname,
                title: info.title,
                subtitle: info.subtitle,
                icon: info.icon,
                timestamp: Date.now()
            };

            // Keep top 3 most recent
            const newItems = [newItem, ...filtered].slice(0, 3);

            localStorage.setItem('chill_recent_activity', JSON.stringify(newItems));
            return newItems;
        });

    }, [pathname]);

    return (
        <RecentActivityContext.Provider value={{ recentItems, sidebarData, updateSidebarData }}>
            {children}
        </RecentActivityContext.Provider>
    );
}

export function useRecentActivity() {
    const context = useContext(RecentActivityContext);
    if (context === undefined) {
        throw new Error('useRecentActivity must be used within a RecentActivityProvider');
    }
    return context;
}
