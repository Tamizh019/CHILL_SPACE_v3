'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';

interface ScrollRevealProps {
    children: React.ReactNode;
    direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
    delay?: number;
    className?: string;
    once?: boolean;
}

export const ScrollReveal = ({ children, direction = 'up', delay = 0, className = '', once = true }: ScrollRevealProps) => {
    const ref = useRef(null);

    let initial: any = { opacity: 0, y: 0, x: 0, scale: 1 };

    switch (direction) {
        case 'up':
            initial.y = 50;
            break;
        case 'down':
            initial.y = -50;
            break;
        case 'left':
            initial.x = -50;
            break;
        case 'right':
            initial.x = 50;
            break;
        case 'scale':
            initial.scale = 0.95;
            break;
        case 'fade':
            initial.opacity = 0;
            break;
    }

    const animate = { opacity: 1, y: 0, x: 0, scale: 1 };

    return (
        <motion.div
            ref={ref}
            initial={initial}
            whileInView={animate}
            viewport={{ once: once }}
            transition={{ duration: 0.8, delay: delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const StaggerContainer = ({ children, delay = 0, staggerChildren = 0.1, className = '' }: any) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        delayChildren: delay,
                        staggerChildren: staggerChildren
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem = ({ children, className = '' }: any) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
