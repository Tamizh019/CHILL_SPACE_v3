"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push('/home');
            router.refresh();
        }
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
                                <div className="w-20 h-20 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:border-violet-500/30 transition-colors group cursor-pointer">
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
                                    Chill
                                </span>
                                <span
                                    className="text-white text-3xl tracking-tighter font-bold ml-1.5"
                                    style={{ fontFamily: "'Outfit', sans-serif" }}
                                >
                                    space
                                </span>
                            </div>
                            <p className="text-[#666] text-sm font-medium">
                                where your conversations live
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors focus:outline-none"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
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

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-500 text-xs">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Submit Button - Subtle Violet Style */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full group relative px-6 py-3.5 mt-2 rounded-full border border-white/20 bg-transparent overflow-hidden transition-all duration-500 hover:border-violet-500/40 hover:bg-violet-500/[0.05] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] active:scale-[0.99] disabled:opacity-50"
                            >
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent group-hover:via-violet-400/80 group-hover:w-3/4 transition-all duration-500" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-4 bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <span className="relative z-10 text-white text-sm font-medium transition-colors duration-300">
                                    {isLoading ? "Signing In..." : "Enter Chill Space"}
                                </span>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 text-xs text-[#555] bg-[#0c0c0c]">or continue with</span>
                            </div>
                        </div>

                        {/* Google Sign In - Monochrome version */}
                        <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-[#111] text-white text-sm font-medium hover:bg-[#151515] hover:border-white/20 transition-all duration-200 group">
                            <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-[#666] mt-8">
                            New here?{" "}
                            <Link href="/signup" className="text-white font-medium hover:text-violet-400 transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}

// Background Effects - Matching Landing Page
const BackgroundEffects = () => (
    <>
        {/* Multi-Layer Violet Gradient */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0f0c15]/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[#130d1c]/35 via-[#0e0b16]/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#1a1126]/30 via-transparent to-transparent" />
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[50%]"
                style={{
                    background: 'radial-gradient(ellipse at bottom center, rgba(29,18,48,0.3) 0%, transparent 70%)',
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
