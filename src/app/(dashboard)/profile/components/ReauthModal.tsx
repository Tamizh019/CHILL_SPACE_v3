'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ReauthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    title?: string;
    description?: string;
    actionLabel?: string;
    mode?: 'password' | 'otp' | 'phrase';
    emailForOtp?: string;
    confirmationPhrase?: string;
}

export function ReauthModal({
    isOpen,
    onClose,
    onVerified,
    title = "Verify Identity",
    description = "Please enter your password to confirm this sensitive action.",
    actionLabel = "Confirm",
    mode = 'password',
    emailForOtp,
    confirmationPhrase
}: ReauthModalProps) {
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [phrase, setPhrase] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otpSent, setOtpSent] = useState(false);
    const supabase = createClient();

    // Effect to send OTP when modal opens in OTP mode
    const hasSentRef = useRef(false);

    useEffect(() => {
        if (isOpen && mode === 'otp' && emailForOtp && !otpSent && !hasSentRef.current) {
            const sendOtp = async () => {
                setIsLoading(true);
                try {
                    const { error } = await supabase.auth.signInWithOtp({ email: emailForOtp });
                    if (error) throw error;
                    setOtpSent(true);
                    hasSentRef.current = true;
                } catch (err: any) {
                    setError("Failed to send code: " + err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            sendOtp();
        }

        // Reset state on open/close
        if (!isOpen) {
            hasSentRef.current = false;
            setOtpSent(false);
            setOtp('');
            setPassword('');
            setPhrase('');
            setError(null);
        }
    }, [isOpen, mode, emailForOtp, supabase.auth]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'password') {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !user.email) throw new Error("User not found");

                const { error: reauthError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: password,
                });
                if (reauthError) throw reauthError;

            } else if (mode === 'otp') {
                if (!emailForOtp) throw new Error("Email required for verification");
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    email: emailForOtp,
                    token: otp,
                    type: 'email',
                });
                if (verifyError) throw verifyError;
            } else if (mode === 'phrase') {
                if (phrase !== confirmationPhrase) {
                    throw new Error("Confirmation phrase does not match.");
                }
            }

            onVerified();
            onClose();
        } catch (err: any) {
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-500/10 rounded-lg">
                                    <ShieldCheck className="w-6 h-6 text-violet-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">{title}</h3>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            {mode === 'otp' && !otpSent && !error ? "Sending verification code..." : description}
                        </p>

                        <form onSubmit={handleVerify} className="space-y-6">

                            {mode === 'password' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="password"
                                            required
                                            autoFocus
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            {mode === 'otp' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Code</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter the 6-digit code"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors tracking-widest text-center text-lg"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 text-center mt-2">
                                        Check your inbox for the code.
                                    </p>
                                </div>
                            )}

                            {mode === 'phrase' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 select-none">
                                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Type the following to confirm:</p>
                                        <p className="text-sm font-mono text-violet-300 break-words font-medium select-text">{confirmationPhrase}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            value={phrase}
                                            onChange={(e) => setPhrase(e.target.value)}
                                            placeholder="Type confirmation phrase here"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                            onPaste={(e) => e.preventDefault()}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || (mode === 'otp' && !otpSent) || (mode === 'phrase' && phrase !== confirmationPhrase)}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Verifying...' : actionLabel}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
