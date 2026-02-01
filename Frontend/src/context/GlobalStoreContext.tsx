'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';

// --- Types ---
type User = Database['public']['Tables']['users']['Row'];
type Channel = Database['public']['Tables']['channels']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface ExtendedUser extends User {
    // Add any joined properties if needed, e.g. status
}

interface CacheItem<T> {
    data: T;
    lastFetched: number;
}

interface GlobalStoreState {
    userProfile: CacheItem<User | null>;
    friends: CacheItem<User[]>;
    channels: CacheItem<Channel[]>;
    recentChats: CacheItem<any[]>; // Simplified for now
}

interface GlobalStoreContextType {
    // Data Accessors
    user: User | null;
    friends: User[];
    channels: Channel[];

    // Status
    isLoading: boolean;

    // Actions (Force Refetch)
    refreshUser: () => Promise<User | null>;
    refreshFriends: () => Promise<void>;
    refreshChannels: () => Promise<void>;

    // Direct Access to Store (for debugging)
    store: GlobalStoreState;
}

const GlobalStoreContext = createContext<GlobalStoreContextType | undefined>(undefined);

// --- Constants ---
const STALE_TIME = {
    USER: 5 * 60 * 1000,      // 5 Minutes (Profile rarely changes)
    FRIENDS: 2 * 60 * 1000,   // 2 Minutes (Online status handled separately via realtime)
    CHANNELS: 5 * 60 * 1000,  // 5 Minutes (Channels rarely change)
};

export function GlobalStoreProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);

    const [store, setStore] = useState<GlobalStoreState>({
        userProfile: { data: null, lastFetched: 0 },
        friends: { data: [], lastFetched: 0 },
        channels: { data: [], lastFetched: 0 },
        recentChats: { data: [], lastFetched: 0 },
    });

    // --- Fetchers ---

    const fetchUser = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && store.userProfile.data && (now - store.userProfile.lastFetched < STALE_TIME.USER)) {
            return store.userProfile.data;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setStore(prev => ({
                    ...prev,
                    userProfile: { data: profile, lastFetched: Date.now() }
                }));
                return profile;
            }
        }
        return null;
    }, [store.userProfile.data, store.userProfile.lastFetched, supabase]);

    const fetchFriends = useCallback(async (force = false, userOverride?: User | null) => {
        const now = Date.now();
        if (!force && store.friends.data.length > 0 && (now - store.friends.lastFetched < STALE_TIME.FRIENDS)) {
            return;
        }

        const currentUser = userOverride || store.userProfile.data;
        if (!currentUser) return; // Can't fetch friends without user

        // Fetch all users except self (Basic "Friends" logic for now)
        const { data } = await supabase
            .from('users')
            .select('*')
            .neq('id', currentUser.id)
            .order('username');

        if (data) {
            setStore(prev => ({
                ...prev,
                friends: { data, lastFetched: Date.now() }
            }));
        }
    }, [store.friends.data.length, store.friends.lastFetched, store.userProfile.data, supabase]);

    const fetchChannels = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && store.channels.data.length > 0 && (now - store.channels.lastFetched < STALE_TIME.CHANNELS)) {
            return;
        }

        const { data } = await supabase
            .from('channels')
            .select('*')
            .order('name');

        if (data) {
            // Inject Announcements
            const announcements: any = {
                id: 'announcements',
                name: 'Announcements',
                type: 'system',
                description: 'Official updates and news from the Chill Space team.'
            };
            const allChannels = [announcements, ...data];

            setStore(prev => ({
                ...prev,
                channels: { data: allChannels, lastFetched: Date.now() }
            }));
        }
    }, [store.channels.data.length, store.channels.lastFetched, supabase]);


    // --- Initialization ---
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const userProfile = await fetchUser();
            // Once user is fetched, we can fetch others in parallel
            await Promise.all([
                fetchFriends(false, userProfile),
                fetchChannels()
            ]);
            if (mounted) setIsLoading(false);
        };


        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                init();
            } else if (event === 'SIGNED_OUT') {
                setStore({
                    userProfile: { data: null, lastFetched: 0 },
                    friends: { data: [], lastFetched: 0 },
                    channels: { data: [], lastFetched: 0 },
                    recentChats: { data: [], lastFetched: 0 },
                });
            }
        });

        // Realtime Subscription for Channels
        const channelSub = supabase
            .channel('global-channels')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
                fetchChannels(true); // Refetch on any change
            })
            .subscribe();

        // Initial load
        init();

        return () => {
            mounted = false;
            subscription.unsubscribe();
            supabase.removeChannel(channelSub);
        };
    }, []); // Run once on mount


    // --- Context Value ---
    const value: GlobalStoreContextType = {
        user: store.userProfile.data,
        friends: store.friends.data,
        channels: store.channels.data,
        isLoading,
        refreshUser: () => fetchUser(true),
        refreshFriends: () => fetchFriends(true),
        refreshChannels: () => fetchChannels(true),
        store
    };

    return (
        <GlobalStoreContext.Provider value={value}>
            {children}
        </GlobalStoreContext.Provider>
    );
}

export function useGlobalStore() {
    const context = useContext(GlobalStoreContext);
    if (context === undefined) {
        throw new Error('useGlobalStore must be used within a GlobalStoreProvider');
    }
    return context;
}
