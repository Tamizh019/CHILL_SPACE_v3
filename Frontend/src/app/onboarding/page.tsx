"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User, Calendar, Lock, ArrowRight, Sparkles, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = Welcome, 2 = Form
    const [username, setUsername] = useState("");
    const [dob, setDob] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);

            // Pre-fill username if available from metadata (optional)
            if (user.user_metadata?.full_name) {
                // simple logic to suggest a username
                const suggestion = user.user_metadata.full_name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 100);
                setUsername(suggestion);
            }
        };
        getUser();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!user) return;

            // 1. Check if username is unique
            // (Assumed: 'users' table has a unique constraint on username or we handle error)

            // 2. Update Profile
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    username,
                    dob: dob || null,
                    // If you have an 'is_onboarded' flag, set it here too
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 3. Set Password (since it's a new OAuth user, they might need one for direct login later)
            if (password) {
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: password
                });
                if (passwordError) throw passwordError;
            }

            // Success!
            router.push("/home");
            router.refresh();

        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0f0c15]/60 via-transparent to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full opacity-40 animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full opacity-30" />
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        className="max-w-lg w-full text-center relative z-10"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-24 h-24 bg-[#111] border border-white/10 rounded-full mx-auto mb-8 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                        >
                            <img
                                src="/logo1.svg"
                                alt="Chill Space"
                                className="w-12 h-12 object-contain"
                            />
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
                        >
                            Oh oh! <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">New here?</span>
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-slate-300 mb-8 leading-relaxed"
                        >
                            It seems this is your first time in Chill Space! <br />
                            Don't worry, we've got you covered. 🚀
                        </motion.p>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-10 mx-auto max-w-md"
                        >
                            <p className="text-slate-400 text-sm font-medium">
                                "Please give us just 2 minutes to set up your profile. We need these details to make your experience amazing!"
                            </p>
                        </motion.div>

                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStep(2)}
                            className="px-8 py-4 bg-white text-black text-lg font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center gap-3 mx-auto"
                        >
                            Let's Get Started <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-md relative z-10"
                    >
                        <div className="bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
                                <p className="text-slate-400 text-sm">One step closer to the chill zone.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username <span className="text-violet-400">*</span></label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Choose a cool handle"
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-600 pl-1">Unique identifier for your profile url.</p>
                                </div>

                                {/* DOB */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type="date"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all [color-scheme:dark] text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Set a Password <span className="text-violet-400">*</span></label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a strong password"
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all placeholder:text-slate-600"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-600 pl-1">Allows you to login without Google next time.</p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                                >
                                    {isLoading ? (
                                        <span className="animate-pulse">Setting up...</span>
                                    ) : (
                                        <>
                                            Complete Profile <CheckCircle className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
