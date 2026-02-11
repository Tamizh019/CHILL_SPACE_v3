"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowDown, MessageSquare, Users, Zap, Shield, Bell, Settings, Code, FileText } from "lucide-react";
import { ParallaxLayer, FloatingElement } from "@/components/animations/ParallaxLayer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal";
import { MagneticButton } from "@/components/animations/MagneticButton";

export const Hero = () => {
    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
                {/* Ultra-Smooth Multi-Layer Violet Gradient - Sanctuary Style with Parallax */}
                <div className="absolute inset-0 pointer-events-none">
                    <ParallaxLayer offset={30} className="absolute inset-0">
                        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0f0c15]/40 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[#130d1c]/35 via-[#0e0b16]/15 to-transparent" />
                    </ParallaxLayer>
                    <ParallaxLayer offset={50} className="absolute inset-0">
                        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#1a1126]/30 via-transparent to-transparent" />
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[50%]"
                            style={{
                                background: 'radial-gradient(ellipse at bottom center, rgba(29,18,48,0.3) 0%, transparent 70%)',
                            }}
                        />
                    </ParallaxLayer>
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

                {/* Floating Star Particles */}
                <StarParticles />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 text-center max-w-4xl mx-auto"
                >
                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-6 md:mb-8 px-2">
                        <span className="bg-gradient-to-b from-white via-white to-[#666] bg-clip-text text-transparent">
                            Chat with your people.
                        </span>
                        <br />
                        <span className="italic font-normal bg-gradient-to-b from-white via-[#ccc] to-[#555] bg-clip-text text-transparent">
                            and Chill.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-sm sm:text-base md:text-lg text-[#888] max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed px-4"
                    >
                        Chill Space is the all-in-one <span className="text-white">collaboration platform</span> built for your crew.
                        Discuss projects, share code, chat privately, and play games together — anytime, anywhere.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <Link href="/login">
                            <CobaltButton>Join Chill Space</CobaltButton>
                        </Link>
                        <button
                            onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
                            className="hidden md:flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors group cursor-pointer"
                        >
                            See what it does
                            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Product Preview Section - Hidden on mobile */}
            <div id="preview" className="hidden md:block">
                <ProductPreview />
            </div>

            {/* Features Section */}
            <FeaturesSection />

            {/* Separator Line Before CTA */}
            <SeparatorLine />

            {/* CTA Section */}
            <CTASection />

            {/* Footer */}
            <Footer />
        </>
    );
};

// --- Separator Line Component ---
const SeparatorLine = () => (
    <div className="relative py-8">
        <div className="absolute left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#8b5cf6]/40 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-[400px] h-6 bg-[#8b5cf6]/10 blur-xl -top-2" />
    </div>
);

// --- Star Particles (Client-only, subtle twinkling dots) ---
const StarParticles = () => {
    const [mounted, setMounted] = useState(false);

    const particles = useMemo(() => {
        return [...Array(40)].map((_, i) => ({
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

// --- Violet-Style Button with Magnetic Effect ---
const CobaltButton = ({ children }: { children: React.ReactNode }) => (
    <MagneticButton className="group relative px-6 py-3 rounded-full border border-white/20 bg-transparent overflow-hidden transition-all duration-300 hover:border-violet-500/40">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent group-hover:via-violet-400/80 group-hover:w-3/4 transition-all duration-300" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-4 bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 text-white text-sm font-medium">
            {children}
        </span>
    </MagneticButton>
);

// --- Product Preview with Interactive Tabs ---
const ProductPreview = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'files'>('dashboard');

    const tabs = [
        { id: 'dashboard' as const, label: 'Dashboard', icon: '🏠' },
        { id: 'chat' as const, label: 'Chat', icon: '💬' },
        { id: 'files' as const, label: 'Files', icon: '📁' },
    ];

    // Sample users for the demo
    const sampleUsers = [
        { name: 'Kalees', avatar: null, status: 'online', lastMsg: 'Hey, check this out!' },
        { name: 'Kubendiran', avatar: null, status: 'online', lastMsg: 'Nice work! 🔥' },
        { name: 'Jenivaa', avatar: null, status: 'away', lastMsg: 'Lets Implement it !' },
        { name: 'ASH', avatar: null, status: 'offline', lastMsg: 'Hi' },
    ];

    const sampleFiles = [
        { name: 'Ex-2 (AIV)', size: '391.3 KB', type: 'PDF', uploader: 'Tamizha...' },
        { name: 'Ex 1 & 2 (AIV)', size: '629.7 KB', type: 'ZIP', uploader: 'Tamizha...' },
        { name: 'Ex-1 (AIV)', size: '293.6 KB', type: 'PDF', uploader: 'Tamizha...' },
        { name: 'git cmds', size: '556 B', type: 'TXT', uploader: 'Kalees' },
    ];

    return (
        <section className="relative py-24 px-6">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 md:mb-12 px-4"
            >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-3 md:mb-4">
                    See it in action
                </h2>
                <p className="text-[#888] text-sm sm:text-base md:text-lg max-w-xl mx-auto">
                    Explore what makes Chill Space your team's favorite hangout
                </p>
            </motion.div>

            {/* Tab Switcher */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex justify-center mb-6 md:mb-8 px-4"
            >
                <div className="inline-flex bg-[#1a1a1a] rounded-full p-1 sm:p-1.5 border border-white/5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1 sm:gap-2 ${activeTab === tab.id
                                ? 'text-white'
                                : 'text-[#666] hover:text-white'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-violet-600/20 border border-violet-500/30 rounded-full"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{tab.icon}</span>
                            <span className="relative z-10 hidden xs:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Browser Window */}
            <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-5xl mx-auto perspective-1000 px-2 sm:px-4"
            >
                <div className="relative rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] overflow-hidden shadow-2xl shadow-violet-500/5">
                    {/* Browser Chrome */}
                    <div className="h-8 sm:h-12 border-b border-white/5 flex items-center px-2 sm:px-4 gap-2 bg-[#0c0c0c]">
                        <div className="flex gap-1 sm:gap-1.5">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57]" />
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#febc2e]" />
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-white/5 text-[10px] sm:text-xs text-[#666] flex items-center gap-1 sm:gap-2">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/50" />
                                <span className="hidden xs:inline">app.chillspace.io</span>
                                <span className="xs:hidden">chillspace.io</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Area with AnimatePresence */}
                    <div className="min-h-[280px] sm:min-h-[350px] md:min-h-[400px] relative overflow-hidden">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {activeTab === 'dashboard' && <DashboardView users={sampleUsers} />}
                            {activeTab === 'chat' && <ChatView users={sampleUsers} />}
                            {activeTab === 'files' && <FilesView files={sampleFiles} />}
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Feature Pills with Magnetic Effects */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mt-8 md:mt-10 px-4"
            >
                {[
                    { icon: '⚡', label: 'Real-time Sync', desc: 'Messages appear instantly', color: 'violet' },
                    { icon: '🎮', label: 'Mini Games', desc: 'Take breaks with friends', color: 'pink' },
                    { icon: '📂', label: 'File Sharing', desc: 'Share code & documents', color: 'blue' },
                ].map((feature, i) => (
                    <MagneticButton key={i} className="block">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: `0 0 30px rgba(139, 92, 246, 0.15)`,
                                transition: { duration: 0.2 }
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                            className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group"
                        >
                            <motion.span
                                className="text-base sm:text-lg"
                                whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.3 }}
                            >
                                {feature.icon}
                            </motion.span>
                            <div>
                                <p className="text-white text-xs sm:text-sm font-medium group-hover:text-violet-300 transition-colors">{feature.label}</p>
                                <p className="text-[#555] text-[10px] sm:text-xs group-hover:text-[#777] transition-colors">{feature.desc}</p>
                            </div>
                        </motion.div>
                    </MagneticButton>
                ))}
            </motion.div>
        </section>
    );
};

// --- Dashboard View ---
const DashboardView = ({ users }: { users: any[] }) => (
    <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-56 border-r border-white/5 p-4 hidden md:block">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 flex items-center justify-center">
                    <img src="/logo1.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-white text-sm font-semibold">chill space</span>
            </div>
            <nav className="space-y-1">
                {[
                    { icon: <MessageSquare size={16} />, label: 'Home', active: true },
                    { icon: <Users size={16} />, label: 'Spaces' },
                    { icon: <Bell size={16} />, label: 'Notifications' },
                    { icon: <Settings size={16} />, label: 'Settings' },
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.active ? 'bg-[#5b21b6]/20 text-[#a78bfa]' : 'text-[#666] hover:text-white'
                            } transition-colors cursor-pointer`}
                    >
                        {item.icon}
                        {item.label}
                    </div>
                ))}
            </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <h3 className="text-2xl text-white font-medium mb-1">Good evening, User.</h3>
                <p className="text-[#666] text-sm">Ready to focus?</p>
            </motion.div>

            {/* Stats Cards (Matching Real App) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Focus Streak */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative p-5 rounded-xl border border-white/5 overflow-hidden group"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full group-hover:bg-orange-500/10 transition-colors" />
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(249,115,22,0.2)] shrink-0">
                            🔥
                        </div>
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-white tracking-tight">12 Days</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1 mb-3">Focus Streak</p>
                            <div className="flex gap-1.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-orange-500' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Time Focused */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative p-5 rounded-xl border border-white/5 overflow-hidden group"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-violet-500/5 blur-[50px] rounded-full group-hover:bg-violet-500/10 transition-colors" />
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(139,92,246,0.2)] shrink-0">
                            ⏱️
                        </div>
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-white tracking-tight">45 mins</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Time Focused</p>
                            <div className="w-full bg-white/10 h-1.5 mt-3 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full w-[45%]" />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[9px] text-slate-500">Today</span>
                                <span className="text-[9px] text-slate-500">Goal: 120m</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Jump Back In (Matching Real App) */}
            <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Jump Back In</h3>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: <MessageSquare size={18} />, label: 'Project Alpha', sub: 'Chat Room', color: 'blue' },
                        { icon: <Code size={18} />, label: 'Frontend Repo', sub: 'Code Base', color: 'purple' },
                        { icon: <Zap size={18} />, label: 'Retro Arcade', sub: 'Game Room', color: 'orange' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="p-4 rounded-xl border border-white/5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 cursor-pointer group"
                            style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                    item.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                                        'bg-orange-500/10 text-orange-400'
                                    }`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.color === 'blue' ? 'bg-blue-500/10 text-blue-300/60' :
                                    item.color === 'purple' ? 'bg-purple-500/10 text-purple-300/60' :
                                        'bg-orange-500/10 text-orange-300/60'
                                    }`}>
                                    {[12, 28, 5][i]}m ago
                                </span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium group-hover:text-violet-400 transition-colors truncate">{item.label}</p>
                                <p className="text-[#555] text-xs truncate">{item.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Sidebar - Recent Chats */}
        <div className="w-64 border-l border-white/5 p-4 hidden lg:block">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Friends Buzz</p>
            <div className="space-y-3">
                {users.map((user, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-white/10 flex items-center justify-center text-white text-xs font-semibold group-hover:border-violet-500/50 transition-colors">
                                {user.name[0]}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${user.status === 'online' ? 'bg-emerald-500' : user.status === 'away' ? 'bg-amber-500' : 'bg-slate-500'
                                }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <p className="text-white text-xs font-medium truncate group-hover:text-violet-400 transition-colors">{user.name}</p>
                                <span className="text-[10px] text-[#444]">{[3, 15, 42, 8][i]}m</span>
                            </div>
                            <p className="text-[#555] text-[10px] truncate">{user.lastMsg}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
);

// --- Chat View (No changes needed, but keeping primarily for context) ---
const ChatView = ({ users }: { users: any[] }) => (
    <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 p-4 hidden md:block">
            <div className="flex items-center justify-between mb-4">
                <p className="text-white text-sm font-medium">Messages</p>
                <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
            </div>
            <div className="space-y-1">
                {users.map((user, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${i === 0 ? 'bg-white/5 border border-white/5' : 'hover:bg-white/[0.02]'
                            }`}
                    >
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center text-white text-xs font-semibold border border-white/5">
                                {user.name[0]}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user.name}</p>
                            <p className="text-[#555] text-xs truncate">{user.lastMsg}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]/50">
            <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xs font-semibold">K</div>
                    <div>
                        <p className="text-white text-sm font-medium leading-none">Kalees</p>
                        <p className="text-emerald-400 text-[10px] mt-1">Online</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {[
                    { from: 'them', msg: 'Hey! Did you check the new assignment?', time: '2:30 PM' },
                    { from: 'me', msg: 'Yeah, looks interesting! Let\'s discuss it later.', time: '2:31 PM' },
                    { from: 'them', msg: 'Check this out! 🔥', time: '2:32 PM' },
                ].map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.from === 'me'
                            ? 'bg-violet-600/90 text-white rounded-br-md shadow-lg shadow-violet-900/20'
                            : 'bg-[#1a1a1a] border border-white/5 text-slate-200 rounded-bl-md'
                            }`}>
                            {msg.msg}
                            <span className="block text-[10px] opacity-50 mt-1 text-right">{msg.time}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus-within:border-white/10 transition-colors">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#444]"
                        disabled
                    />
                    <button className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30">
                        <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// --- Files View ---
const FilesView = ({ files }: { files: any[] }) => (
    <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-56 border-r border-white/5 p-4 hidden md:block">
            <p className="text-white text-sm font-medium mb-4 pl-1">Chat & Files</p>
            <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-lg">
                {['Spaces', 'Files', 'DMs'].map((tab, i) => (
                    <button
                        key={i}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${i === 1 ? 'bg-violet-500/20 text-violet-300 shadow-sm' : 'text-[#666] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-xs font-medium">
                    <span className="text-violet-400">📁</span> All Files
                </div>
                <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-6 mb-3 pl-2">By Channel</p>
                {['# NLP Project', '# UI Design', '# Backend', '# General'].map((channel, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#666] text-xs hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <span className="opacity-50">#</span> {channel.replace('# ', '')}
                    </div>
                ))}
            </div>
        </div>

        {/* Files Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white text-sm font-medium flex items-center gap-2">
                        All Files
                    </h3>
                    <p className="text-[#555] text-xs mt-1">Recently uploaded</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                    <span>+</span> Upload
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { name: 'Project_Proposal.docx', size: '2.4 MB', type: 'DOC', color: 'blue' },
                    { name: 'Final_Presentation.pptx', size: '14.2 MB', type: 'PPT', color: 'orange' },
                    { name: 'Q3_Budget_Sheet.xlsx', size: '856 KB', type: 'XLS', color: 'green' },
                    { name: 'main_server.py', size: '12 KB', type: 'CODE', color: 'yellow' },
                    { name: 'Design_System_v2.fig', size: '45 MB', type: 'FIG', color: 'purple' },
                    { name: 'requirements.txt', size: '2 KB', type: 'TXT', color: 'gray' },
                    { name: 'logo_assets.zip', size: '128 MB', type: 'ZIP', color: 'pink' },
                    { name: 'api_docs.md', size: '15 KB', type: 'MD', color: 'cyan' },
                ].map((file, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/20 hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col gap-3"
                    >
                        <div className="flex justify-between items-start">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border border-white/5 ${file.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                file.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                                    file.color === 'green' ? 'bg-emerald-500/10 text-emerald-400' :
                                        file.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
                                            file.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                                                file.color === 'pink' ? 'bg-pink-500/10 text-pink-400' :
                                                    file.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' :
                                                        'bg-slate-500/10 text-slate-400'
                                }`}>
                                {file.type}
                            </div>
                            <div className="text-[#333] group-hover:text-white/20 transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                            </div>
                        </div>

                        <div>
                            <p className="text-slate-300 text-xs font-medium truncate group-hover:text-violet-300 transition-colors mb-0.5">{file.name}</p>
                            <p className="text-[#444] text-[10px]">{file.size}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
);


// --- Stat Card ---
const StatCard = ({
    label,
    value,
    badge,
    badgeColor
}: {
    label: string;
    value: string;
    badge?: string;
    badgeColor?: "green" | "violet";
}) => (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="text-xs text-[#666] mb-2 flex items-center gap-2">
            {label}
            {badge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeColor === "green" ? "bg-green-500/20 text-green-400" : "bg-violet-500/20 text-violet-400"
                    }`}>
                    {badge}
                </span>
            )}
        </div>
        <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
);

// --- Features Section ---
const FeaturesSection = () => {
    return (
        <section className="py-32 px-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
            >
                {/* Left - Headline */}
                <div>
                    <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
                        A chill place for<br />
                        your group.
                    </h2>
                </div>

                {/* Right - Story */}
                <div>
                    <p className="text-[#888] text-lg leading-relaxed mb-6">
                        Chill Space is a small project I built for my{" "}
                        <span className="text-white">friends and classmates</span>.
                        Because in college WiFi/ethernet, WhatsApp and socials get blocked —
                        but we still needed a place to talk, share files, and help each other with code.
                    </p>
                    <p className="text-white font-medium">
                        It's simple, fast, and made for daily college life.
                    </p>
                </div>
            </motion.div>

            {/* Sub-headline */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start mt-16 md:mt-32 mb-8 md:mb-16"
            >
                {/* Left - Headline */}
                <div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4">
                        Chat, files, and code.<br />
                        That's it.
                    </h3>
                </div>

                {/* Right - Description */}
                <div>
                    <p className="text-[#888] text-base sm:text-lg leading-relaxed">
                        Send messages, share files, and paste code snippets in one place —
                        perfect for <span className="text-white">projects, quick doubts,</span> <span className="text-white">and everyday conversations.</span>
                    </p>
                </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
            >
                {[
                    {
                        icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
                        title: "Super Fast",
                        description: "Messages show up instantly — even on slow college networks.",
                    },
                    {
                        icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />,
                        title: "Private Chats",
                        description: "Your messages stay inside your group. No one else can see them.",
                    },
                    {
                        icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
                        title: "Your Space",
                        description: "Create a group space for your friends, classmates, or project team.",
                    },
                ].map((feature, i) => (
                    <div
                        key={i}
                        className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 sm:mb-4">
                            {feature.icon}
                        </div>
                        <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h4>
                        <p className="text-xs sm:text-sm text-[#666]">{feature.description}</p>
                    </div>
                ))}
            </motion.div>

            {/* Additional Features */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6"
            >
                <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 sm:mb-4">
                        <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">Code Editor</h4>
                    <p className="text-xs sm:text-sm text-[#666]">Built-in real-time editor for collaborative coding and debugging sessions.</p>
                </div>
                <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 sm:mb-4">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">Interactive Games</h4>
                    <p className="text-xs sm:text-sm text-[#666]">Take a break with built-in mini-games designed for group interaction.</p>
                </div>
                <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors sm:col-span-2 md:col-span-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 sm:mb-4">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">Project Spaces</h4>
                    <p className="text-xs sm:text-sm text-[#666]">Organized threads and file vaults for specific college projects and goals.</p>
                </div>
            </motion.div>
        </section>
    );
};

// --- CTA Section ---
const CTASection = () => {
    return (
        <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#110d1c] via-[#100b1a]/70 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[700px] h-[200px] sm:h-[350px] bg-[#2e1065]/40 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center max-w-3xl mx-auto"
            >
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 sm:mb-6 leading-tight">
                    Ready to start your<br />
                    Chill Space?
                </h2>
                <p className="text-[#888] text-sm sm:text-base md:text-lg mb-8 sm:mb-12 px-4">
                    Connect Your crew. Collaborate on projects. Play games. Chill together.
                </p>
                <Link href="/signup">
                    <CobaltButton>Join Chill Space</CobaltButton>
                </Link>
            </motion.div>
        </section>
    );
};

// --- Footer (Clean & Simple) ---
const Footer = () => {
    return (
        <footer className="relative border-t border-white/5 py-6 sm:py-10 px-4 sm:px-6 bg-[#0a0a0a]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[1px] bg-gradient-to-r from-transparent via-[#8b5cf6]/40 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] sm:w-[300px] h-6 sm:h-8 bg-[#8b5cf6]/10 blur-xl" />

            <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:flex-row md:justify-between">
                {/* Left Side - Copyright & Links */}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs sm:text-sm text-[#666]">
                    <span>© 2026 Chill Space Inc.</span>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                    </div>
                </div>

                {/* Right Side - Report Bug & Social */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Report Bug */}
                    <a href="mailto:jefftamizh01@gmail.com" className="group flex items-center gap-2 text-xs sm:text-sm text-[#666] hover:text-white transition-colors">
                        <span className="text-xs font-medium">Report Bug</span>
                        <div className="p-1 sm:p-1.5 rounded-full bg-white/5 group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </a>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                        <span className="text-[#666] text-xs font-medium">Connect</span>
                        {/* LinkedIn */}
                        <a href="https://www.linkedin.com/in/tamizharasan-r-a6931828a/" target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-white transition-colors p-1">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                        {/* GitHub */}
                        <a href="https://github.com/Tamizh019" target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-white transition-colors p-1">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Text */}
            <div className="max-w-6xl mx-auto mt-6 sm:mt-8 text-[10px] sm:text-xs text-[#555] leading-relaxed flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between md:items-center">
                <p className="max-w-xl text-center md:text-left">
                    Chill Space is a real-time communication platform, not a telecommunications provider. Messaging services are provided through secure, encrypted channels.
                </p>
                <p className="text-[#666] text-center md:text-right whitespace-nowrap">
                    Designed & Developed by <span className="text-white font-medium">Tamizharasan</span>
                </p>
            </div>
        </footer>
    );
};
