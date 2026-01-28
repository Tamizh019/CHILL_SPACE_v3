"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background Effects */}
            <BackgroundEffects />

            {/* Star Particles */}
            <StarParticles />

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card Container */}
                <div className="relative p-10 rounded-3xl border border-white/10 bg-[#0c0c0c]/80 backdrop-blur-xl">
                    {/* Subtle top glow */}
                    <div className="absolute -inset-px bg-gradient-to-b from-white/5 via-transparent to-transparent rounded-3xl pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Logo Link to Home */}
                        <div className="flex justify-center mb-8">
                            <Link href="/">
                                <div className="w-20 h-20 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:border-cyan-500/30 transition-colors group cursor-pointer">
                                    <img
                                        src="/logo1.svg"
                                        alt="Chill Space"
                                        className="w-10 h-10 object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                                    />
                                </div>
                            </Link>
                        </div>

                        {/* Title & Tagline */}
                        <div className="text-center mb-10">
                            <div className="flex items-center justify-center mb-2">
                                <span
                                    className="text-white/50 text-3xl tracking-tighter font-extralight"
                                    style={{ fontFamily: "'Outfit', sans-serif" }}
                                >
                                    Join
                                </span>
                                <span
                                    className="text-white text-3xl tracking-tighter font-bold ml-1.5"
                                    style={{ fontFamily: "'Outfit', sans-serif" }}
                                >
                                    The Crew
                                </span>
                            </div>
                            <p className="text-[#666] text-sm font-medium">
                                Made for friends, projects, and late-night doubts.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="What friends call you"
                                        required
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a password"
                                        required
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        required
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button - Subtle Cobalt Style */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full group relative px-6 py-3.5 mt-2 rounded-full border border-white/20 bg-transparent overflow-hidden transition-all duration-500 hover:border-white/40 hover:bg-white/[0.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] active:scale-[0.99] disabled:opacity-50"
                            >
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent group-hover:via-cyan-400/80 group-hover:w-3/4 transition-all duration-500" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-4 bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <span className="relative z-10 text-white text-sm font-medium transition-colors duration-300">
                                    {isLoading ? "Creating..." : "Create Account"}
                                </span>
                            </button>
                        </form>



                        {/* Login Link */}
                        <p className="text-center text-sm text-[#666] mt-8">
                            Already have an account?{" "}
                            <Link href="/login" className="text-white font-medium hover:text-cyan-400 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// Background Effects - Matching Landing Page
const BackgroundEffects = () => (
    <>
        {/* Multi-Layer Blue Gradient */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0c1420]/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[#0a1525]/35 via-[#0b1320]/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#0d1a2d]/30 via-transparent to-transparent" />
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[50%]"
                style={{
                    background: 'radial-gradient(ellipse at bottom center, rgba(13,26,45,0.25) 0%, transparent 70%)',
                }}
            />
        </div>

        {/* Subtle Grid Pattern */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
            }}
        />

        {/* Grid fade at edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-transparent opacity-90 pointer-events-none" style={{ height: '30%' }} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-50 pointer-events-none" style={{ height: '20%' }} />
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0a0a0a] to-transparent opacity-60 pointer-events-none" style={{ width: '15%' }} />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#0a0a0a] to-transparent opacity-60 pointer-events-none" style={{ width: '15%' }} />
    </>
);

// Star Particles
const StarParticles = () => {
    const [mounted, setMounted] = useState(false);

    const particles = useMemo(() => {
        return [...Array(30)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 1.2 + 0.3,
            delay: Math.random() * 5,
            duration: 2 + Math.random() * 3,
            maxOpacity: 0.3 + Math.random() * 0.4,
        }));
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        opacity: [0, p.maxOpacity, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};
