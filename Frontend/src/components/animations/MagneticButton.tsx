'use client';

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";

export const MagneticButton = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string, onClick?: () => void }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        let { left, top, width, height } = currentTarget.getBoundingClientRect();
        let x = clientX - (left + width / 2);
        let y = clientY - (top + height / 2);
        mouseX.set(x * 0.3);
        mouseY.set(y * 0.3);
    }

    function handleMouseLeave() {
        mouseX.set(0);
        mouseY.set(0);
    }

    return (
        <motion.button
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ x: mouseX, y: mouseY }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {children}
        </motion.button>
    );
};

export const GlowButton = ({ children, className = "", onClick }: any) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`relative group overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onClick={onClick}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(139, 92, 246, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />
            <div className="relative">{children}</div>
        </div>
    );
};
