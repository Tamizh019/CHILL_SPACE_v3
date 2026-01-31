'use client';

import { motion } from 'framer-motion';
import { Construction, Sparkles } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full opacity-50" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center text-center max-w-lg"
            >
                {/* Icon Container */}
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full group-hover:bg-violet-500/30 transition-colors" />
                    <div className="relative w-24 h-24 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                        {icon || <Construction className="w-10 h-10 text-violet-400" />}
                    </div>
                    {/* Floating Elements */}
                    <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -top-2 -right-2 bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-xl"
                    >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                    </motion.div>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                    {title}
                </h1>

                <div className="flex items-center gap-3 px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">In Development</span>
                </div>

                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                    {description}
                </p>

                {/* Optional: Newsletter or Notify Me button could go here */}
            </motion.div>
        </div>
    );
}
