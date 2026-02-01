'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Mail, User, Lock, Shield, X, Save, Upload,
    CheckCircle, AlertCircle, LogOut, Bell, Palette,
    ArrowLeft, ChevronRight, Calendar, Crown, Star
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ReauthModal } from './components/ReauthModal';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'notifications'>('profile');
    const [securityView, setSecurityView] = useState<'menu' | 'password'>('menu');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [reauthType, setReauthType] = useState<'password' | 'otp' | 'phrase' | null>(null);
    const [pendingAction, setPendingAction] = useState<any>(null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const supabase = createClient();


    // User State
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [dob, setDob] = useState('');
    const [role, setRole] = useState('Member');

    // Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    setUser(profile);
                    setUsername(profile.username || '');
                    setEmail(authUser.email || '');
                    setAvatarUrl(profile.avatar_url);
                    setDob(profile.dob || '');
                    setRole(profile.role || 'Member');
                }
            }
        };
        fetchUser();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    username,
                    avatar_url: avatarUrl,
                    dob: dob || null
                })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            router.refresh();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const executePasswordChange = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setNewPassword('');
            setConfirmPassword('');
            setSecurityView('menu');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        // Trigger reauthentication before saving
        setReauthType('password');
        setPendingAction(() => executePasswordChange);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        setIsLoading(true);
        setMessage(null);

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            setMessage({ type: 'success', text: 'Image uploaded. Click Save Changes to apply permanently.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const executeEmailChange = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Verification email sent to new address' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email === user?.email || !email) return;

        // Direct call without reauth modal (Supabase handles verify link)
        await executeEmailChange();
        setIsEditingEmail(false);
    };

    const executeDeleteAccount = async () => {
        setIsLoading(true);
        try {
            // First delete profile data
            const { error: profileError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Then sign out (account deletion in auth is harder via client SDK, Usually needs admin API or a trigger)
            // For now, we delete profile and kick them out. 
            // Better: Use a Supabase Edge Function to delete the auth user.
            await supabase.auth.signOut();
            router.push('/');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setReauthType('phrase');
        setPendingAction(() => executeDeleteAccount);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const getRoleBadge = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'owner':
            case 'admin':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">{roleName}</span>
                    </div>
                );
            case 'moderator':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">{roleName}</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-700/30 border border-slate-600/30 rounded-full">
                        <Star className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{roleName}</span>
                    </div>
                );
        }
    };

    return (
        <main className="flex-1 flex overflow-hidden p-8 gap-8 relative">
            {/* Go Back Button */}
            <div className="absolute top-8 left-8 z-10">
                <button
                    onClick={() => router.push('/home')}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl backdrop-blur-md border border-white/5 transition-all group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Home</span>
                </button>
            </div>

            <div className="flex-1 flex gap-8 max-w-6xl mx-auto w-full mt-12">
                {/* Sidebar Navigation */}
                <div className="w-64 flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-white mb-6 px-4">Settings</h1>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile'
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        Public Profile
                    </button>

                    <button
                        onClick={() => { setActiveTab('security'); setSecurityView('menu'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'security'
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Shield className="w-5 h-5" />
                        Account Security
                    </button>

                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'appearance'
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Palette className="w-5 h-5" />
                        Appearance
                        <span className="ml-auto text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/20">WIP</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'notifications'
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Bell className="w-5 h-5" />
                        Notifications
                        <span className="ml-auto text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/20">WIP</span>
                    </button>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-[#0c0c0c]/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #4c1d95 0%, transparent 50%)' }} />

                    <div className="relative h-full overflow-y-auto p-10">
                        {/* Status Message */}
                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`mb-8 p-4 rounded-xl border flex items-center gap-3 text-sm ${message.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && user && (
                            <div className="max-w-xl animate-fade-in">
                                <h2 className="text-2xl font-bold text-white mb-2">Public Profile</h2>
                                <p className="text-slate-400 text-sm mb-10">Manage how you appear to others on Chill Space.</p>

                                {/* Avatar & Role Header */}
                                <div className="flex items-start gap-8 mb-10">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-[#1a1a1a] bg-[#1a1a1a] overflow-hidden relative shadow-2xl">
                                            {avatarUrl ? (
                                                <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-500 bg-black">
                                                    {username?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            {/* Hover Overlay */}
                                            <div
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Camera className="w-10 h-10 text-white/90" />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 pt-2">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-xl font-bold text-white">{username || 'User'}</h3>
                                            {getRoleBadge(role)}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 w-fit"
                                        >
                                            Change Avatar
                                        </button>
                                        <p className="text-xs text-slate-500">
                                            Max size 2MB (JPG, PNG)
                                        </p>
                                    </div>
                                </div>

                                <form className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                placeholder="Your display name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="date"
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 pb-8 border-b border-white/5">
                                        <button
                                            type="button"
                                            onClick={handleProfileUpdate}
                                            disabled={isLoading}
                                            className="px-8 py-3 bg-white text-black font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-white/5"
                                        >
                                            {isLoading ? 'Saving...' : 'Update General Info'}
                                            {!isLoading && <Save className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="space-y-6 pt-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Mail className="w-5 h-5 text-violet-400" />
                                            Email Address
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login Email</label>

                                            {isEditingEmail ? (
                                                <div className="animate-fade-in space-y-3">
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                            placeholder="Enter new email address"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleEmailChange}
                                                            disabled={isLoading || !email || email === user?.email}
                                                            className="px-4 py-2 bg-violet-600 text-white font-medium text-xs rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-50"
                                                        >
                                                            Send Verification Link
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsEditingEmail(false);
                                                                setEmail(user?.email || '');
                                                            }}
                                                            className="px-4 py-2 bg-white/5 text-slate-400 font-medium text-xs rounded-lg hover:bg-white/10 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 italic">
                                                        We'll send a confirmation link to <strong>{email}</strong>.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex-1 opacity-60">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                        <input
                                                            type="text"
                                                            value={user?.email || ''}
                                                            readOnly
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-400 pointer-events-none"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditingEmail(true)}
                                                        className="px-4 py-3.5 bg-white/5 text-white font-medium text-sm rounded-xl hover:bg-white/10 border border-white/10 transition-colors whitespace-nowrap"
                                                    >
                                                        Edit Email
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-12 mt-12 border-t border-red-500/10">
                                        <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                            Danger Zone
                                        </h3>
                                        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">Delete Account</h4>
                                                <p className="text-slate-500 text-xs">This action is permanent and cannot be undone.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDeleteClick}
                                                className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-xs rounded-lg hover:bg-red-500/20 transition-colors"
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="max-w-xl animate-fade-in">
                                <h2 className="text-2xl font-bold text-white mb-2">Account Security</h2>
                                <p className="text-slate-400 text-sm mb-10">Manage your password and security settings.</p>

                                {securityView === 'menu' && (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setSecurityView('password')}
                                            className="w-full p-5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-2xl flex items-center gap-4 transition-all group text-left"
                                        >
                                            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                                                <Lock className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold text-base mb-1">Change Password</h3>
                                                <p className="text-slate-400 text-xs">Update your password to keep your account secure</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                                        </button>

                                        {/* Future Options Placeholders */}
                                        <button
                                            disabled
                                            className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 text-left opacity-50 cursor-not-allowed"
                                        >
                                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold text-base mb-1">Two-Factor Authentication</h3>
                                                <p className="text-slate-400 text-xs">Add an extra layer of security (Coming Soon)</p>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {securityView === 'password' && (
                                    <div className="animate-fade-in-right">
                                        <button
                                            onClick={() => setSecurityView('menu')}
                                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back to Security Options
                                        </button>

                                        <form onSubmit={handlePasswordChange} className="space-y-8">
                                            <div className="space-y-6">
                                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                                        <Lock className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-orange-200 mb-1">Password Requirements</h4>
                                                        <p className="text-xs text-orange-200/60 leading-relaxed">
                                                            Ensure your password is at least 6 characters long. Use a mix of letters, numbers, and symbols.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                        <input
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                            placeholder="Enter new password"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                        <input
                                                            type="password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                            placeholder="Re-enter new password"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="px-8 py-3 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-500/20"
                                                >
                                                    {isLoading ? 'Updating...' : 'Update Password'}
                                                    {!isLoading && <Shield className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {(activeTab === 'appearance' || activeTab === 'notifications') && (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    {activeTab === 'appearance' ? <Palette className="w-10 h-10 text-violet-400" /> : <Bell className="w-10 h-10 text-violet-400" />}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                                <p className="text-slate-500 max-w-sm">
                                    We're working hard to bring you more customization options. Stay tuned for future updates!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

                            <h3 className="text-xl font-semibold text-white mb-2 relative z-10">Sign Out?</h3>
                            <p className="text-slate-400 text-sm mb-6 relative z-10">
                                Are you sure you want to log out of your session?
                            </p>

                            <div className="flex gap-3 relative z-10">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all shadow-[0_0_10px_rgba(248,113,113,0.1)]"
                                >
                                    Yes, Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Reauthentication Modal */}
            <ReauthModal
                isOpen={!!reauthType}
                onClose={() => {
                    setReauthType(null);
                    setPendingAction(null);
                }}
                onVerified={() => {
                    if (pendingAction) {
                        pendingAction();
                    }
                }}
                mode={reauthType === 'phrase' ? 'phrase' : reauthType === 'otp' ? 'otp' : 'password'}
                emailForOtp={user?.email}
                confirmationPhrase={`I confirm to delete my ${username || 'account'} from Chill Space`}
                title={
                    reauthType === 'phrase' ? "Confirm Account Deletion" :
                        reauthType === 'otp' ? "Verify Deletion" :
                            "Verify Identity"
                }
                description={
                    reauthType === 'phrase' ? "This will permanently delete your account. This action cannot be undone." :
                        reauthType === 'otp' ? "We will send a one-time code to your email. Enter it below to permanently delete your account." :
                            "Please enter your password to confirm this sensitive action."
                }
                actionLabel={reauthType === 'phrase' || reauthType === 'otp' ? "Delete Forever" : "Confirm"}
            />
        </main>
    );
}
