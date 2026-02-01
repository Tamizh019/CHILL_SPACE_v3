'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DemoUser {
    name: string;
    avatar: string;
    color: string;
    isYou?: boolean;
}

const USERS: Record<string, DemoUser> = {
    tamizharasan: { name: 'Tamizharasan', avatar: 'T', color: 'from-violet-500 to-purple-600', isYou: true },
    kalees: { name: 'Kalees', avatar: 'K', color: 'from-blue-500 to-cyan-500' },
    kubendiran: { name: 'Kubendiran', avatar: 'Ku', color: 'from-green-500 to-emerald-500' },
    sravya: { name: 'Sravya', avatar: 'S', color: 'from-pink-500 to-rose-500' },
    ashwin: { name: 'Ashwin', avatar: 'A', color: 'from-orange-500 to-amber-500' },
    varshini: { name: 'Varshini', avatar: 'V', color: 'from-purple-500 to-fuchsia-500' },
    jenivaa: { name: 'Jenivaa', avatar: 'J', color: 'from-teal-500 to-cyan-500' },
    bhogeshwar: { name: 'Bhogeshwar', avatar: 'B', color: 'from-red-500 to-rose-500' },
};

interface DemoStep {
    id: number;
    showAt: number;
    user: DemoUser;
    content: string;
    tip?: { title: string; description: string };
    showMentionDropdown?: boolean;
    showReaction?: { emoji: string; users: string[] };
    showReplyPreview?: { to: string; text: string };
    isCodeBlock?: boolean;
    isLinkPreview?: boolean;
}

const DEMO_STEPS: DemoStep[] = [
    {
        id: 1,
        showAt: 0,
        user: USERS.sravya,
        content: "Hey everyone! 👋 Just joined the channel!",
    },
    {
        id: 2,
        showAt: 3000,
        user: USERS.kalees,
        content: "Welcome to Chill Space!",
    },
    {
        id: 3,
        showAt: 6500,
        user: USERS.tamizharasan,
        content: "Hey @Kalees thanks for the warm welcome!",
        tip: {
            title: "💡 Mention Users",
            description: "Type @ followed by a name to mention someone. They'll get notified instantly!"
        },
        showMentionDropdown: true,
    },
    {
        id: 4,
        showAt: 11500,
        user: USERS.kubendiran,
        content: "```javascript\nconst greeting = 'Hello World!';\nconsole.log(greeting);\n```",
        tip: {
            title: "💡 Share Code",
            description: "Wrap code with ``` and add language:\n```javascript\nyour code here\n```"
        },
        isCodeBlock: true,
    },
    {
        id: 5,
        showAt: 16000,
        user: USERS.tamizharasan,
        content: "Nice code! 🔥",
    },
    {
        id: 6,
        showAt: 19500,
        user: USERS.ashwin,
        content: "That's a clean example!",
        showReaction: { emoji: '🔥', users: ['Tamizharasan', 'Sravya'] },
        tip: {
            title: "💡 React to Messages",
            description: "Hover over any message and click the arrow to add emoji reactions!"
        },
    },
    {
        id: 7,
        showAt: 24000,
        user: USERS.varshini,
        content: "When would we use this pattern?",
        showReplyPreview: { to: 'Kubendiran', text: "const greeting = 'Hello World!'..." },
        tip: {
            title: "💡 Reply to Messages",
            description: "Click 'Reply' on any message to start a thread. Keeps conversations organized!"
        },
    },
    {
        id: 8,
        showAt: 28500,
        user: USERS.jenivaa,
        content: "Check out this project: https://chill-space.netlify.app",
        tip: {
            title: "💡 Rich Link Previews",
            description: "Paste any URL and it automatically shows a rich preview card!"
        },
        isLinkPreview: true,
    },
    {
        id: 9,
        showAt: 33000,
        user: USERS.bhogeshwar,
        content: "This chat is so smooth! 🚀",
    },
    {
        id: 10,
        showAt: 36000,
        user: USERS.sravya,
        content: "Ready to start chatting! 💜",
    },
];

// Extract all tips for navigation
const ALL_TIPS = DEMO_STEPS.filter(step => step.tip).map(step => step.tip!);

export function ChatDemoModal({ isOpen, onClose }: ChatDemoModalProps) {
    const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
    const [currentTip, setCurrentTip] = useState<{ title: string; description: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [demoCompleted, setDemoCompleted] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);
    const typingTimeoutRef = useRef<number | null>(null);

    const totalDuration = 38000; 

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior
            });
        }
    }, []);

    const resetDemo = useCallback(() => {
        setVisibleSteps([]);
        setCurrentTip(null);
        setProgress(0);
        setTypingUser(null);
        setShowMentionDropdown(false);
        setDemoCompleted(false);
        setCurrentTipIndex(0);
        setIsPlaying(true);
    }, []);

    // Navigate tips manually after demo completes
    const goToNextTip = useCallback(() => {
        if (currentTipIndex < ALL_TIPS.length - 1) {
            const nextIndex = currentTipIndex + 1;
            setCurrentTipIndex(nextIndex);
            setCurrentTip(ALL_TIPS[nextIndex]);
        }
    }, [currentTipIndex]);

    const goToPrevTip = useCallback(() => {
        if (currentTipIndex > 0) {
            const prevIndex = currentTipIndex - 1;
            setCurrentTipIndex(prevIndex);
            setCurrentTip(ALL_TIPS[prevIndex]);
        }
    }, [currentTipIndex]);

    useEffect(() => {
        if (isOpen) {
            resetDemo();
            setTimeout(() => scrollToBottom('auto'), 100);
        } else {
            setIsPlaying(false);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    }, [isOpen, resetDemo, scrollToBottom]);

    useEffect(() => {
        if (visibleSteps.length > 0 && isPlaying) {
            scrollToBottom();
        }
    }, [visibleSteps, isPlaying, scrollToBottom]);

    useEffect(() => {
        if (!isPlaying) return;

        startTimeRef.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTimeRef.current;
            const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);

            setProgress(currentProgress);

            DEMO_STEPS.forEach((step, stepIndex) => {
                if (elapsed >= step.showAt - 1000 && elapsed < step.showAt) {
                    if (!typingUser && step.user.name !== 'Tamizharasan') {
                        setTypingUser(step.user.name);
                    }
                }

                if (elapsed >= step.showAt) {
                    setVisibleSteps(prev => {
                        if (!prev.includes(step.id)) {
                            setTypingUser(null);

                            if (step.tip) {
                                setCurrentTip(step.tip);
                                setCurrentTipIndex(ALL_TIPS.findIndex(t => t === step.tip));
                            }

                            if (step.showMentionDropdown) {
                                setShowMentionDropdown(true);
                                typingTimeoutRef.current = window.setTimeout(() => {
                                    setShowMentionDropdown(false);
                                }, 3000);
                            }

                            return [...prev, step.id];
                        }
                        return prev;
                    });
                }
            });

            if (elapsed >= totalDuration) {
                setIsPlaying(false);
                setTypingUser(null);
                setDemoCompleted(true);
                // Show first tip after completion
                if (ALL_TIPS.length > 0) {
                    setCurrentTip(ALL_TIPS[0]);
                    setCurrentTipIndex(0);
                }
            } else {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [isPlaying]);

    const renderCodeBlock = (content: string) => {
        const match = content.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
            const [, lang, code] = match;
            return (
                <div className="bg-black/60 rounded-lg overflow-hidden border border-white/10 mt-1">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
                        <span className="text-[10px] text-slate-400 font-mono">{lang || 'code'}</span>
                        <button className="text-[10px] text-slate-500 hover:text-white">Copy</button>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-green-400 overflow-x-auto whitespace-pre">
                        {code.trim()}
                    </pre>
                </div>
            );
        }
        return content;
    };

    const renderLinkPreview = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 p-2.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 max-w-xs"
        >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                CS
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">Chill Space</p>
                <p className="text-[10px] text-slate-500 truncate">Your cozy corner of the internet</p>
            </div>
        </motion.div>
    );

    const renderContent = (step: DemoStep) => {
        if (step.isCodeBlock) {
            return renderCodeBlock(step.content);
        }

        const parts = step.content.split(/(@\w+)/g);
        return (
            <span>
                {parts.map((part, i) =>
                    part.startsWith('@') ? (
                        <span key={i} className="bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/40 font-medium">
                            {part}
                        </span>
                    ) : part
                )}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-violet-950/20 to-purple-950/10">
                        <div>
                            <h2 className="text-lg font-bold text-white">Chat Features Tutorial</h2>
                            <p className="text-xs text-slate-400">Watch how to use Chill Space chat</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-white/5 relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
                            style={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0c0c0c] to-[#110d1c]">
                            {/* Channel Header */}
                            <div className="h-12 flex items-center gap-2 px-4 border-b border-white/5 bg-black/20 flex-shrink-0">
                                <span className="text-lg text-slate-500">#</span>
                                <span className="text-sm font-semibold text-white">general</span>
                                <span className="text-[10px] text-slate-500 ml-2">• Demo Channel</span>
                            </div>

                            {/* Messages - Scrollable */}
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-3"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                {DEMO_STEPS.map((step) => {
                                    const isVisible = visibleSteps.includes(step.id);
                                    const isYou = step.user.isYou;

                                    return (
                                        <AnimatePresence key={step.id}>
                                            {isVisible && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`flex items-start gap-2.5 max-w-[80%] ${isYou ? 'flex-row-reverse' : ''}`}>
                                                        {/* Avatar */}
                                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${step.user.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg`}>
                                                            {step.user.avatar}
                                                        </div>

                                                        {/* Message */}
                                                        <div className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                                                            {/* Name & Badge */}
                                                            <div className={`flex items-center gap-2 mb-1 ${isYou ? 'flex-row-reverse' : ''}`}>
                                                                <span className="text-xs font-semibold text-white">{step.user.name}</span>
                                                                {isYou && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-medium">
                                                                        You
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] text-slate-500">just now</span>
                                                            </div>

                                                            {/* Reply Preview */}
                                                            {step.showReplyPreview && (
                                                                <div className="flex items-start gap-2 mb-1.5 text-[10px]">
                                                                    <div className="w-0.5 h-5 bg-violet-500/50 rounded-full" />
                                                                    <div>
                                                                        <span className="text-slate-500">Replying to </span>
                                                                        <span className="text-violet-400 font-medium">{step.showReplyPreview.to}</span>
                                                                        <p className="text-slate-600 truncate max-w-[200px]">{step.showReplyPreview.text}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Bubble */}
                                                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isYou
                                                                ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-md shadow-lg shadow-violet-500/20'
                                                                : 'bg-[#1e1e1e] border border-white/5 text-slate-200 rounded-bl-md'
                                                                }`}>
                                                                {renderContent(step)}
                                                                {step.isLinkPreview && renderLinkPreview()}
                                                            </div>

                                                            {/* Reactions */}
                                                            {step.showReaction && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ delay: 0.4, type: 'spring', stiffness: 400 }}
                                                                    className="flex gap-1.5 mt-2"
                                                                >
                                                                    <span className="px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs flex items-center gap-1 hover:bg-violet-500/30 transition-colors cursor-pointer">
                                                                        <span>{step.showReaction.emoji}</span>
                                                                        <span className="text-violet-300 font-medium">{step.showReaction.users.length}</span>
                                                                    </span>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    );
                                })}

                                {/* Typing Indicator */}
                                <AnimatePresence>
                                    {typingUser && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-xs text-slate-400"
                                        >
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                                                        animate={{ y: [0, -4, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    />
                                                ))}
                                            </div>
                                            <span>{typingUser} is typing...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mention Dropdown Overlay */}
                            <AnimatePresence>
                                {showMentionDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="mx-4 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                                    >
                                        <div className="px-3 py-1.5 border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                                            Members matching @K
                                        </div>
                                        {[USERS.kalees, USERS.kubendiran].map((user, i) => (
                                            <div
                                                key={i}
                                                className={`px-3 py-2.5 flex items-center gap-2.5 transition-colors ${i === 0 ? 'bg-violet-500/10' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-[9px] font-bold`}>
                                                    {user.avatar}
                                                </div>
                                                <span className="text-sm text-white font-medium">{user.name}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input Area - Fixed at Bottom */}
                            <div className="p-3 border-t border-white/5 bg-black/30 flex-shrink-0">
                                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#1e1e1e] rounded-xl border border-white/10">
                                    <span className="text-slate-500 text-lg">💬</span>
                                    <span className="text-sm text-slate-500 flex-1">Message #general...</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600 cursor-pointer hover:text-slate-400">😊</span>
                                        <span className="text-slate-600 cursor-pointer hover:text-slate-400">📎</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-600 mt-2 text-center">
                                    ``` for code • @ to mention • hover to react • click reply
                                </p>
                            </div>
                        </div>

                        {/* Tutorial Panel */}
                        <div className="w-72 border-l border-white/5 bg-black/30 flex flex-col">
                            <div className="p-4 border-b border-white/5">
                                <h3 className="text-sm font-bold text-white mb-1">💡 Feature Tips</h3>
                                <p className="text-[10px] text-slate-500">Learn as you watch the conversation</p>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto">
                                <AnimatePresence mode="wait">
                                    {currentTip ? (
                                        <motion.div
                                            key={currentTip.title}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-3"
                                        >
                                            <div className="text-3xl mb-2">{currentTip.title.split(' ')[0]}</div>
                                            <h4 className="text-base font-semibold text-white">
                                                {currentTip.title.replace(/^💡\s*/, '')}
                                            </h4>
                                            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                                                {currentTip.description}
                                            </p>

                                            {/* Navigation Arrows - Only show after demo completes */}
                                            {demoCompleted && ALL_TIPS.length > 1 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center justify-between pt-4 mt-4 border-t border-white/10"
                                                >
                                                    <button
                                                        onClick={goToPrevTip}
                                                        disabled={currentTipIndex === 0}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                                    >
                                                        <span className="text-lg">←</span>
                                                        Prev
                                                    </button>

                                                    <span className="text-xs text-slate-500">
                                                        {currentTipIndex + 1} / {ALL_TIPS.length}
                                                    </span>

                                                    <button
                                                        onClick={goToNextTip}
                                                        disabled={currentTipIndex === ALL_TIPS.length - 1}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                                    >
                                                        Next
                                                        <span className="text-lg">→</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-12"
                                        >
                                            <div className="text-5xl mb-3">💭</div>
                                            <p className="text-xs text-slate-500">
                                                {demoCompleted ? 'Demo complete! Use arrows to browse tips.' : 'Tips will appear here...'}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="p-4 border-t border-white/5 space-y-3">
                                <button
                                    onClick={resetDemo}
                                    disabled={isPlaying && !demoCompleted}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    <span className="text-lg">🔄</span>
                                    Replay Tutorial
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
                                >
                                    {demoCompleted ? "Let's Chat!" : 'Start Chatting!'}
                                    <span className="text-lg">→</span>
                                </button>
                                <p className="text-center text-[10px] text-slate-600">
                                    {Math.round(progress)}% complete • {demoCompleted ? 'Browse tips with arrows!' : 'Watch till end'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
