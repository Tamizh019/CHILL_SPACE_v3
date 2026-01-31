'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setTimeout(() => {
                    router.push('/home');
                }, 2000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0f0c15]/40 via-transparent to-transparent" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="relative p-10 rounded-3xl border border-white/10 bg-[#0c0c0c]/80 backdrop-blur-xl shadow-2xl">
                    <div className="absolute -inset-px bg-gradient-to-b from-white/5 via-transparent to-transparent rounded-3xl pointer-events-none" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 mx-auto bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                                <Lock className="w-8 h-8 text-violet-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
                            <p className="text-[#666] text-sm font-medium">
                                Please enter your new password below.
                            </p>
                        </div>

                        {message?.type === 'success' ? (
                            <div className="text-center py-8">
                                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">All Set!</h3>
                                <p className="text-slate-400 mb-6">Your password has been securely updated.</p>
                                <p className="text-xs text-slate-500 animate-pulse">Redirecting to Dashboard...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* New Password */}
                                <div className="space-y-2">
                                    <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            required
                                            className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="block text-xs text-[#888] font-medium uppercase tracking-wider">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            required
                                            className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#444] text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {message?.type === 'error' && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-500 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>{message.text}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full group relative px-6 py-3.5 mt-2 rounded-full border border-white/20 bg-transparent overflow-hidden transition-all duration-500 hover:border-violet-500/40 hover:bg-violet-500/[0.05] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] active:scale-[0.99] disabled:opacity-50"
                                >
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent group-hover:via-violet-400/80 group-hover:w-3/4 transition-all duration-500" />
                                    <span className="relative z-10 text-white text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2">
                                        {isLoading ? "Updating..." : "Update Password"}
                                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                                    </span>
                                </button>
                            </form>
                        )}

                        <div className="mt-8 text-center">
                            <Link href="/" className="text-xs text-[#666] hover:text-white transition-colors">
                                Cancel and return to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
