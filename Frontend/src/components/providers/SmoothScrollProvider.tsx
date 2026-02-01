'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const SmoothScrollContext = createContext<Lenis | null>(null);

export const useSmoothScroll = () => {
    return useContext(SmoothScrollContext);
};

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        lenisRef.current = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 2,
        });

        const animationFrame = (time: number) => {
            lenisRef.current?.raf(time);
            requestAnimationFrame(animationFrame);
        };
        requestAnimationFrame(animationFrame);

        return () => {
            lenisRef.current?.destroy();
        };
    }, []);

    return (
        <SmoothScrollContext.Provider value={lenisRef.current}>
            {children}
        </SmoothScrollContext.Provider>
    );
}
