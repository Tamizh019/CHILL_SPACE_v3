'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface FocusContextType {
    focusStreak: number;
    todayMinutes: number;
    goalMinutes: number;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
    const [focusStreak, setFocusStreak] = useState(0);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const goalMinutes = 120;

    // Helper to get today's date string for comparison
    const getTodayString = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        const initFocusParams = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch user data
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('focus_streak, today_minutes, last_focus_date, last_active_date')
                    .eq('id', user.id)
                    .single();

                if (error || !profile) {
                    console.error('Error fetching focus stats:', error);
                    return;
                }

                const today = getTodayString();
                const lastDate = profile.last_focus_date;

                // --- Streak Logic ---
                // If last_focus_date is yesterday, streak continues.
                // If last_focus_date is today, streak is already counted for today (keep it).
                // If last_focus_date is older than yesterday, reset streak to 0 (or 1 if we count today as start).

                let newStreak = profile.focus_streak || 0;
                let newTodayMinutes = profile.today_minutes || 0;

                // Check for day reset
                if (lastDate !== today) {
                    // It's a new day!
                    newTodayMinutes = 0; // Reset daily minutes

                    // Check streak continuity
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayString = yesterday.toISOString().split('T')[0];

                    if (lastDate === yesterdayString) {
                        // Streak continues! increment? 
                        // Usually streak increments when you *complete* a goal, or just by showing up.
                        // Let's say showing up (visiting dashboard) counts.
                        newStreak += 1;
                    } else if (lastDate === today) {
                        // Already handled
                    } else {
                        // Broken streak
                        newStreak = 1;
                    }

                    // Update DB with new "Today" values immediately
                    await supabase.from('users').update({
                        focus_streak: newStreak,
                        today_minutes: 0,
                        last_focus_date: today,
                        last_active_date: new Date().toISOString()
                    }).eq('id', user.id);
                }

                setFocusStreak(newStreak);
                setTodayMinutes(newTodayMinutes);

            } catch (err) {
                console.error('Failed to init focus context:', err);
            } finally {
                setIsLoading(false);
            }
        };

        initFocusParams();
    }, []);

    // Timer to increment minutes and sync to DB
    useEffect(() => {
        const supabase = createClient();
        let interval: NodeJS.Timeout;

        const updateDb = async (minutes: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('users').update({
                    today_minutes: minutes,
                    last_active_date: new Date().toISOString()
                }).eq('id', user.id);
            }
        };

        interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setTodayMinutes(prev => {
                    const newVal = prev + 1;
                    // Update DB every minute (debouncing not strictly necessary for 1 min interval)
                    updateDb(newVal);
                    return newVal;
                });
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <FocusContext.Provider value={{ focusStreak, todayMinutes, goalMinutes }}>
            {children}
        </FocusContext.Provider>
    );
}

export function useFocus() {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
}
