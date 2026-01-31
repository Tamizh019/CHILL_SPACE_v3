'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface FocusContextType {
    focusStreak: number;
    todayMinutes: number;
    goalMinutes: number;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
    const [focusStreak, setFocusStreak] = useState(0);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const goalMinutes = 120; // Hardcoded goal for now

    // Load initial data
    useEffect(() => {
        const loadData = () => {
            const storedStreak = localStorage.getItem('chill_focus_streak');
            const storedMinutes = localStorage.getItem('chill_today_minutes');
            const lastActiveDate = localStorage.getItem('chill_last_active_date');

            const today = new Date().toDateString();

            if (storedStreak) setFocusStreak(parseInt(storedStreak, 10));

            // Reset minutes if it's a new day
            if (lastActiveDate !== today) {
                setTodayMinutes(0);
                localStorage.setItem('chill_today_minutes', '0');
                localStorage.setItem('chill_last_active_date', today);

                // Simple streak logic: if last active was yesterday, increment. 
                // If longer, reset. If same day, keep.
                // For simplicity MVP: we just keep the streak if accessed within 48h, else reset
                const lastDate = lastActiveDate ? new Date(lastActiveDate) : new Date();
                const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 2) {
                    setFocusStreak(1); // Reset
                    localStorage.setItem('chill_focus_streak', '1');
                } else if (lastActiveDate && lastActiveDate !== today) {
                    const newStreak = (parseInt(storedStreak || '0') + 1);
                    setFocusStreak(newStreak);
                    localStorage.setItem('chill_focus_streak', newStreak.toString());
                } else if (!lastActiveDate) {
                    setFocusStreak(1);
                    localStorage.setItem('chill_focus_streak', '1');
                }

            } else {
                if (storedMinutes) setTodayMinutes(parseInt(storedMinutes, 10));
            }
        };

        loadData();
    }, []);

    // Timer to increment minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setTodayMinutes(prev => {
                    const newVal = prev + 1;
                    localStorage.setItem('chill_today_minutes', newVal.toString());
                    return newVal;
                });
            }
        }, 60000); // Every minute

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
