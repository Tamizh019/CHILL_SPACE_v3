'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ParallaxLayerProps {
    children: React.ReactNode;
    offset?: number;
    className?: string;
}

export const ParallaxLayer = ({ children, offset = 50, className = '' }: ParallaxLayerProps) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start']
    });

    const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

    return (
        <motion.div ref={ref} style={{ y }} className={className}>
            {children}
        </motion.div>
    );
};

interface ParallaxTiltProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

export const ParallaxTilt = ({ children, className = '', intensity = 10 }: ParallaxTiltProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start']
    });

    const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [intensity, 0, -intensity]);

    return (
        <motion.div
            ref={ref}
            style={{
                rotateX,
                transformPerspective: 1000,
                transformStyle: 'preserve-3d'
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const FloatingElement = ({ children, className = '', duration = 6 }: any) => {
    return (
        <motion.div
            animate={{
                y: [0, -20, 0],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
