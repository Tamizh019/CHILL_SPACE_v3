"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowDown, MessageSquare, Users, Zap, Shield, Bell, Settings, Code, FileText } from "lucide-react";

export const Hero = () => {
    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
                {/* Ultra-Smooth Multi-Layer Blue Gradient - Cobalt Style */}
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
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-8">
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
                        className="text-base md:text-lg text-[#888] max-w-2xl mx-auto mb-12 leading-relaxed"
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
                        <Link href="/signup">
                            <CobaltButton>Join Chill Space</CobaltButton>
                        </Link>
                        <button
                            onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors group cursor-pointer"
                        >
                            See what it does
                            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Product Preview Section */}
            <div id="preview">
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
        <div className="absolute left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#1a4a7a]/50 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 w-[400px] h-6 bg-[#1a4a7a]/15 blur-xl -top-2" />
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

// --- Cobalt-Style Button (Outlined with bottom glow) ---
const CobaltButton = ({ children }: { children: React.ReactNode }) => (
    <button className="group relative px-6 py-3 rounded-full border border-white/20 bg-transparent overflow-hidden transition-all duration-300 hover:border-white/40">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent group-hover:via-cyan-400/80 group-hover:w-3/4 transition-all duration-300" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-4 bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 text-white text-sm font-medium">
            {children}
        </span>
    </button>
);

// --- Product Preview ---
const ProductPreview = () => {
    return (
        <section className="relative py-20 px-6">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="max-w-6xl mx-auto"
            >
                <div className="relative rounded-2xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                    <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-[#666]">
                                app.chillspace.io
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        <div className="w-56 border-r border-white/5 p-4 hidden md:block">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img src="/logo1.svg" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span
                                    className="text-white text-sm"
                                    style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
                                >
                                    chill space
                                </span>
                            </div>
                            <nav className="space-y-1">
                                {[
                                    { icon: <MessageSquare size={16} />, label: "Messages", active: true },
                                    { icon: <Users size={16} />, label: "Spaces" },
                                    { icon: <Bell size={16} />, label: "Notifications" },
                                    { icon: <Settings size={16} />, label: "Settings" },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.active
                                            ? "bg-white/10 text-white"
                                            : "text-[#666] hover:text-white hover:bg-white/5"
                                            } transition-colors cursor-pointer`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </div>
                                ))}
                            </nav>
                        </div>

                        <div className="flex-1 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-white text-sm font-medium">Messages</span>
                                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">Live</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard label="Active chats" value="12" badge="+3" badgeColor="green" />
                                <StatCard label="Unread messages" value="28" badge="-8" badgeColor="blue" />
                                <StatCard label="Response time" value="< 2m" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

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
    badgeColor?: "green" | "blue";
}) => (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="text-xs text-[#666] mb-2 flex items-center gap-2">
            {label}
            {badge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeColor === "green" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
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
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mt-32 mb-16"
            >
                {/* Left - Headline */}
                <div>
                    <h3 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
                        Chat, files, and code.<br />
                        That's it.
                    </h3>
                </div>

                {/* Right - Description */}
                <div>
                    <p className="text-[#888] text-lg leading-relaxed">
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
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {[
                    {
                        icon: <Zap className="w-5 h-5" />,
                        title: "Super Fast",
                        description: "Messages show up instantly — even on slow college networks.",
                    },
                    {
                        icon: <Shield className="w-5 h-5" />,
                        title: "Private Chats",
                        description: "Your messages stay inside your group. No one else can see them.",
                    },
                    {
                        icon: <Users className="w-5 h-5" />,
                        title: "Your Space",
                        description: "Create a group space for your friends, classmates, or project team.",
                    },
                ].map((feature, i) => (
                    <div
                        key={i}
                        className="group p-6 rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4">
                            {feature.icon}
                        </div>
                        <h4 className="text-white font-medium mb-2">{feature.title}</h4>
                        <p className="text-sm text-[#666]">{feature.description}</p>
                    </div>
                ))}
            </motion.div>

            {/* Additional Features */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
            >
                <div className="group p-6 rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4">
                        <Code className="w-5 h-5" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Code Editor</h4>
                    <p className="text-sm text-[#666]">Built-in real-time editor for collaborative coding and debugging sessions.</p>
                </div>
                <div className="group p-6 rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Interactive Games</h4>
                    <p className="text-sm text-[#666]">Take a break with built-in mini-games designed for group interaction.</p>
                </div>
                <div className="group p-6 rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Project Spaces</h4>
                    <p className="text-sm text-[#666]">Organized threads and file vaults for specific college projects and goals.</p>
                </div>
            </motion.div>
        </section>
    );
};

// --- CTA Section ---
const CTASection = () => {
    return (
        <section className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a2e] via-[#0c1525]/70 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#0d2847]/50 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center max-w-3xl mx-auto"
            >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight">
                    Ready to start your<br />
                    Chill Space?
                </h2>
                <p className="text-[#888] text-lg mb-12">
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
        <footer className="relative border-t border-white/5 py-10 px-6 bg-[#0a0a0a]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-[#1a4a7a]/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-8 bg-[#1a4a7a]/10 blur-xl" />

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 text-sm text-[#666]">
                    <span>© 2026 Chill Space Inc.</span>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                </div>
                <div className="flex flex-col items-center md:items-end gap-4">
                    {/* Report Bug */}
                    <a href="mailto:jefftamizh01@gmail.com" className="group flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors">
                        <span className="text-xs font-medium">Report Bug</span>
                        <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </a>

                    {/* Check Code / Contact */}
                    <div className="flex items-center gap-3">
                        <span className="text-[#666] text-xs font-medium">Connect</span>
                        {/* LinkedIn */}
                        <a href="https://www.linkedin.com/in/tamizharasan-r-a6931828a/" target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                        {/* GitHub */}
                        <a href="https://github.com/Tamizh019" target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
            <div className="max-w-6xl mx-auto mt-8 text-xs text-[#555] leading-relaxed space-y-2 flex flex-col md:flex-row justify-between items-center">
                <p>
                    Chill Space is a real-time communication platform, not a telecommunications provider. Messaging services are provided through secure, encrypted channels.
                </p>
                <p className="text-[#666]">
                    Designed & Developed by <span className="text-white font-medium">Tamizharasan</span>
                </p>
            </div>
        </footer>
    );
};
