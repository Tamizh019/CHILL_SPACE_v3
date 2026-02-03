'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, ChevronDown, ChevronUp, Terminal, Loader2, Trash2,
    Code2, FileCode, Clock, CheckCircle, XCircle, Lock,
    Trophy, Target, Sparkles, BookOpen, Maximize2, Minimize2,
    AlertTriangle, FileWarning
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// ============================================================================
// LANGUAGE ICONS (SVG Components)
// ============================================================================

const LanguageIcons = {
    python: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M12 2C6.48 2 6 4.02 6 5.5V8h6v1H5.5C3.02 9 2 11.02 2 12.5S3.02 18 5.5 18H8v-2.5c0-1.48 1.02-3.5 3.5-3.5h5c1.48 0 2.5-1.02 2.5-2.5v-4C19 4.02 17.48 2 16 2h-4zm-2.5 2.5a1 1 0 110 2 1 1 0 010-2z" fill="#3B82F6" />
            <path d="M12 22c5.52 0 6-2.02 6-3.5V16h-6v-1h6.5c2.48 0 3.5-2.02 3.5-3.5S20.98 6 18.5 6H16v2.5c0 1.48-1.02 3.5-3.5 3.5h-5C6.02 12 5 13.02 5 14.5v4C5 19.98 6.52 22 8 22h4zm2.5-2.5a1 1 0 110-2 1 1 0 010 2z" fill="#FBBF24" />
        </svg>
    ),
    java: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.762.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218" fill="#EF4444" />
            <path d="M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0 0-8.216 2.051-4.292 6.573" fill="#EF4444" />
        </svg>
    ),
    javascript: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="2" fill="#FBBF24" />
            <path d="M12.5 17.5c0 1.5-1 2.5-2.5 2.5s-2-.5-2.5-1.5l1.5-.75c.25.5.5.75 1 .75s1-.25 1-1v-5h2v5zM18 18.5c-.5 1-1.5 1.5-3 1.5-1.75 0-2.75-.75-3.25-1.75l1.5-.75c.35.6.75 1 1.75 1 .75 0 1.25-.35 1.25-.85 0-.6-.5-.8-1.25-1.15l-.5-.2c-1.25-.55-2.1-1.2-2.1-2.6 0-1.3 1-2.3 2.55-2.3 1.1 0 1.9.4 2.45 1.4l-1.35.85c-.3-.55-.6-.75-1.1-.75-.5 0-.8.3-.8.75 0 .5.3.75 1 1.05l.5.2c1.5.65 2.35 1.3 2.35 2.75 0 1.6-1.25 2.45-2.9 2.45" fill="#0A0A0A" />
        </svg>
    ),
    typescript: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="2" fill="#3B82F6" />
            <path d="M13 11h-2v6c0 .3-.1.5-.2.7-.1.2-.3.3-.5.4-.2.1-.5.2-.8.2-.3 0-.6-.1-.9-.2l-.3 1.2c.4.2.9.3 1.4.3.4 0 .8-.1 1.1-.2.4-.2.6-.4.8-.7.2-.3.3-.7.3-1.2v-6.5zM17.5 11h-5.5v1.2h2v7.3h1.5v-7.3h2v-1.2z" fill="white" />
        </svg>
    ),
    rust: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M12 2L3.5 6.5v11L12 22l8.5-4.5v-11L12 2z" fill="none" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="#F97316" />
        </svg>
    ),
    go: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M3 12.5c1-1.5 3-2.5 5-2.5s3.5 1 4 2c.5-1 2-2 4-2s4 1 5 2.5c-1 1.5-3 2.5-5 2.5s-3.5-1-4-2c-.5 1-2 2-4 2s-4-1-5-2.5z" fill="#22D3EE" />
            <circle cx="7" cy="12" r="1.5" fill="#0A0A0A" />
            <circle cx="17" cy="12" r="1.5" fill="#0A0A0A" />
        </svg>
    ),
    cpp: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#8B5CF6" />
            <text x="12" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">C++</text>
        </svg>
    ),
};

// ============================================================================
// LANGUAGES CONFIG  
// ============================================================================

const LANGUAGES = [
    { id: 'python', name: 'Python', IconComponent: LanguageIcons.python, extension: '.py', status: 'available', color: 'from-blue-500/20 to-yellow-500/20', monacoLang: 'python', defaultCode: '# Write your Python code here\nprint("Hello, Chill Space!")' },
    { id: 'java', name: 'Java', IconComponent: LanguageIcons.java, extension: '.java', status: 'available', color: 'from-red-500/20 to-orange-500/20', monacoLang: 'java', defaultCode: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Chill Space!");\n    }\n}' },
    { id: 'javascript', name: 'JavaScript', IconComponent: LanguageIcons.javascript, extension: '.js', status: 'available', color: 'from-yellow-500/20 to-amber-500/20', monacoLang: 'javascript', defaultCode: '// Write your JavaScript code here\nconsole.log("Hello, Chill Space!");' },
    { id: 'typescript', name: 'TypeScript', IconComponent: LanguageIcons.typescript, extension: '.ts', status: 'coming_soon', color: 'from-blue-500/20 to-cyan-500/20', monacoLang: 'typescript', defaultCode: '' },
    { id: 'rust', name: 'Rust', IconComponent: LanguageIcons.rust, extension: '.rs', status: 'coming_soon', color: 'from-orange-500/20 to-red-500/20', monacoLang: 'rust', defaultCode: '' },
    { id: 'go', name: 'Go', IconComponent: LanguageIcons.go, extension: '.go', status: 'coming_soon', color: 'from-cyan-500/20 to-teal-500/20', monacoLang: 'go', defaultCode: '' },
    { id: 'cpp', name: 'C++', IconComponent: LanguageIcons.cpp, extension: '.cpp', status: 'coming_soon', color: 'from-violet-500/20 to-purple-500/20', monacoLang: 'cpp', defaultCode: '' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_CODE_API_URL || 'http://localhost:8080/api/v1';

// Terminal height constraints
const MIN_TERMINAL_HEIGHT = 100;
const MAX_TERMINAL_HEIGHT = 500;
const DEFAULT_TERMINAL_HEIGHT = 200;

// ============================================================================
// ERROR PARSER
// ============================================================================

interface ParsedError {
    type: 'traceback' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    location?: { file: string; line: number; func?: string };
    details?: string[];
}

function parseErrorOutput(stderr: string, language: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const lines = stderr.split('\n').filter(l => l.trim());

    if (language === 'python') {
        let currentError: Partial<ParsedError> | null = null;
        let collectingTraceback = false;
        const tracebackLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('Traceback')) {
                collectingTraceback = true;
                tracebackLines.length = 0;
                continue;
            }

            if (collectingTraceback && line.startsWith('  File')) {
                tracebackLines.push(line);
                if (i + 1 < lines.length && lines[i + 1].startsWith('    ')) {
                    tracebackLines.push(lines[i + 1]);
                    i++;
                }
                continue;
            }

            const errorMatch = line.match(/^(\w+Error|\w+Exception|Error|Exception):\s*(.+)$/);
            if (errorMatch) {
                let location: ParsedError['location'];
                if (tracebackLines.length > 0) {
                    const lastFile = tracebackLines[tracebackLines.length - 2] || tracebackLines[tracebackLines.length - 1];
                    const fileMatch = lastFile?.match(/File "(.+?)", line (\d+)(?:, in (.+))?/);
                    if (fileMatch) {
                        location = {
                            file: fileMatch[1].includes('<string>') ? 'your code' : fileMatch[1].split(/[/\\]/).pop() || fileMatch[1],
                            line: parseInt(fileMatch[2]),
                            func: fileMatch[3]
                        };
                    }
                }

                errors.push({
                    type: 'error',
                    title: errorMatch[1],
                    message: errorMatch[2],
                    location,
                    details: tracebackLines.length > 0 ? [...tracebackLines] : undefined
                });
                collectingTraceback = false;
                tracebackLines.length = 0;
            }
        }

        if (errors.length === 0 && stderr.trim()) {
            errors.push({
                type: 'error',
                title: 'Error',
                message: stderr.trim()
            });
        }
    } else if (language === 'java') {
        const javaErrorMatch = stderr.match(/error:\s*(.+)/i);
        const lineMatch = stderr.match(/:(\d+):/);

        if (javaErrorMatch) {
            errors.push({
                type: 'error',
                title: 'Compilation Error',
                message: javaErrorMatch[1],
                location: lineMatch ? { file: 'Main.java', line: parseInt(lineMatch[1]) } : undefined
            });
        } else if (stderr.includes('Exception')) {
            const exMatch = stderr.match(/(\w+Exception):\s*(.+)?/);
            errors.push({
                type: 'error',
                title: exMatch?.[1] || 'Exception',
                message: exMatch?.[2] || stderr
            });
        } else if (stderr.trim()) {
            errors.push({
                type: 'error',
                title: 'Error',
                message: stderr.trim()
            });
        }
    } else {
        const jsErrorMatch = stderr.match(/(TypeError|ReferenceError|SyntaxError|Error):\s*(.+)/);
        if (jsErrorMatch) {
            errors.push({
                type: 'error',
                title: jsErrorMatch[1],
                message: jsErrorMatch[2]
            });
        } else if (stderr.trim()) {
            errors.push({
                type: 'error',
                title: 'Error',
                message: stderr.trim()
            });
        }
    }

    return errors;
}

// ============================================================================
// ERROR DISPLAY COMPONENT
// ============================================================================

function ErrorDisplay({ errors, rawStderr }: { errors: ParsedError[]; rawStderr: string }) {
    const [showRaw, setShowRaw] = useState(false);

    if (errors.length === 0 && !rawStderr) return null;

    return (
        <div className="space-y-3">
            {errors.map((error, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border-b border-red-500/10">
                        <div className="p-1.5 rounded-md bg-red-500/20">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-400">{error.title}</span>
                                {error.location && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <FileWarning className="w-3 h-3" />
                                        {error.location.file}
                                        {error.location.line && ` : line ${error.location.line}`}
                                        {error.location.func && ` in ${error.location.func}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-3">
                        <p className="text-[13px] text-red-300 font-mono">{error.message}</p>

                        {error.details && error.details.length > 0 && (
                            <details className="mt-3">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                                    Show traceback ({error.details.length / 2} frames)
                                </summary>
                                <div className="mt-2 space-y-1 text-xs font-mono text-slate-500 pl-2 border-l-2 border-red-500/20">
                                    {error.details.map((line, j) => (
                                        <div key={j} className={line.startsWith('    ') ? 'text-slate-400 pl-4' : ''}>
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            ))}

            {rawStderr && (
                <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"
                >
                    {showRaw ? 'Hide' : 'Show'} raw output
                </button>
            )}
            {showRaw && rawStderr && (
                <pre className="text-xs text-slate-500 font-mono bg-black/30 p-3 rounded-lg overflow-auto max-h-32">
                    {rawStderr}
                </pre>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CodePage() {
    const [activeMode, setActiveMode] = useState<'playground' | 'challenges'>('playground');

    // Editor state
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].defaultCode);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<{ stdout: string; stderr: string; duration: number; success: boolean; errors: ParsedError[] } | null>(null);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Terminal state
    const [terminalOpen, setTerminalOpen] = useState(true);
    const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const previousHeightRef = useRef(DEFAULT_TERMINAL_HEIGHT);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);

    // Check backend health
    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
                setBackendStatus(response.ok ? 'online' : 'offline');
            } catch {
                setBackendStatus('offline');
            }
        };
        checkBackend();
        const interval = setInterval(checkBackend, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startY = e.clientY;
        const startHeight = terminalHeight;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = startY - e.clientY;
            const newHeight = Math.min(MAX_TERMINAL_HEIGHT, Math.max(MIN_TERMINAL_HEIGHT, startHeight + delta));
            setTerminalHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [terminalHeight]);

    const toggleMaximize = () => {
        if (isMaximized) {
            setTerminalHeight(previousHeightRef.current);
            setIsMaximized(false);
        } else {
            previousHeightRef.current = terminalHeight;
            setTerminalHeight(MAX_TERMINAL_HEIGHT);
            setIsMaximized(true);
        }
    };

    const handleLanguageChange = (lang: typeof LANGUAGES[0]) => {
        if (lang.status !== 'available') return;
        setSelectedLanguage(lang);
        setCode(lang.defaultCode);
        setIsDropdownOpen(false);
        setOutput(null);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setTerminalOpen(true);
        setOutput(null);

        const start = Date.now();

        try {
            const res = await fetch(`${API_BASE_URL}/code/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: selectedLanguage.id, code }),
                signal: AbortSignal.timeout(15000)
            });

            const data = await res.json();
            const stderr = data.stderr || data.error || '';
            const errors = stderr ? parseErrorOutput(stderr, selectedLanguage.id) : [];

            setOutput({
                stdout: data.stdout || '',
                stderr,
                duration: data.duration_ms || (Date.now() - start),
                success: data.exit_code === 0 && !data.error,
                errors
            });
        } catch {
            setOutput({
                stdout: `Hello, Chill Space! [Demo Mode]\n\n⚠️ Backend offline. Start with:\ncd backend && cargo run`,
                stderr: '',
                duration: Date.now() - start,
                success: true,
                errors: []
            });
        }
        setIsRunning(false);
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        editor.focus();
    };

    const lineCount = code.split('\n').length;
    const availableLanguages = LANGUAGES.filter(l => l.status === 'available');
    const comingSoonLanguages = LANGUAGES.filter(l => l.status === 'coming_soon');

    return (
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0a0a]">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/3 blur-[150px] rounded-full" />
            </div>

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#141414] rounded-lg p-0.5 border border-white/[0.06]">
                        <button
                            onClick={() => setActiveMode('playground')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeMode === 'playground'
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                }`}
                        >
                            <Code2 className="w-4 h-4" />
                            <span>Playground</span>
                        </button>
                        <button
                            onClick={() => setActiveMode('challenges')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeMode === 'challenges'
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                }`}
                        >
                            <Trophy className="w-4 h-4" />
                            <span>Challenges</span>
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/[0.06]" />

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                        <span className={`w-2 h-2 rounded-full transition-colors ${backendStatus === 'online' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' :
                            backendStatus === 'offline' ? 'bg-amber-400 shadow-lg shadow-amber-400/30' : 'bg-slate-500 animate-pulse'
                            }`} />
                        <span className="text-xs text-slate-400 font-medium">
                            {backendStatus === 'online' ? 'Connected' : backendStatus === 'offline' ? 'Demo' : '...'}
                        </span>
                    </div>
                </div>

                {activeMode === 'playground' && (
                    <div className="flex items-center gap-3">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gradient-to-r ${selectedLanguage.color} border border-white/[0.08] hover:border-violet-500/30 transition-all text-sm group`}
                            >
                                <selectedLanguage.IconComponent />
                                <span className="text-white font-medium">{selectedLanguage.name}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full right-0 mt-2 w-72 rounded-xl bg-[#0d0d0d] border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden"
                                    >
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available Languages
                                            </div>
                                            {availableLanguages.map((lang) => (
                                                <button
                                                    key={lang.id}
                                                    onClick={() => handleLanguageChange(lang)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-lg mb-0.5 ${selectedLanguage.id === lang.id
                                                        ? `bg-gradient-to-r ${lang.color} border border-white/[0.08] text-white`
                                                        : 'text-slate-300 hover:bg-white/[0.04]'
                                                        }`}
                                                >
                                                    <lang.IconComponent />
                                                    <span className="font-medium flex-1 text-left">{lang.name}</span>
                                                    {selectedLanguage.id === lang.id && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-2 border-t border-white/[0.04] bg-white/[0.01]">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> Coming Soon
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {comingSoonLanguages.map((lang) => (
                                                    <div key={lang.id} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 cursor-not-allowed rounded-md bg-white/[0.02] border border-dashed border-white/[0.04]">
                                                        <div className="opacity-40"><lang.IconComponent /></div>
                                                        <span className="font-medium">{lang.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            onClick={handleRun}
                            disabled={isRunning || !code.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${isRunning
                                ? 'bg-violet-500/20 text-violet-300 cursor-wait border border-violet-500/20'
                                : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isRunning ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
                            ) : (
                                <><Play className="w-4 h-4 fill-current" /> Run Code</>
                            )}
                        </motion.button>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeMode === 'playground' ? (
                    <>
                        {/* Monaco Editor */}
                        <div
                            className="flex-1 overflow-hidden"
                            style={{ height: terminalOpen ? `calc(100% - ${terminalHeight}px)` : '100%' }}
                        >
                            <Editor
                                height="100%"
                                language={selectedLanguage.monacoLang}
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                onMount={handleEditorDidMount}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Consolas, monospace',
                                    fontLigatures: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    lineNumbers: 'on',
                                    renderLineHighlight: 'all',
                                    cursorBlinking: 'smooth',
                                    cursorSmoothCaretAnimation: 'on',
                                    smoothScrolling: true,
                                    padding: { top: 16, bottom: 16 },
                                    bracketPairColorization: { enabled: true },
                                    guides: {
                                        bracketPairs: true,
                                        indentation: true,
                                    },
                                    suggest: {
                                        showKeywords: true,
                                        showSnippets: true,
                                    },
                                    quickSuggestions: {
                                        other: true,
                                        comments: false,
                                        strings: false,
                                    },
                                }}
                            />
                        </div>

                        {/* Terminal */}
                        <AnimatePresence>
                            {terminalOpen && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: terminalHeight }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-[#0d0d0d] border-t border-white/[0.06] flex flex-col overflow-hidden relative"
                                >
                                    <div
                                        onMouseDown={handleMouseDown}
                                        className={`absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize group z-10 flex items-center justify-center ${isResizing ? 'bg-violet-500/30' : 'hover:bg-violet-500/20'}`}
                                    >
                                        <div className={`w-12 h-1 rounded-full transition-colors ${isResizing ? 'bg-violet-400' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                                    </div>

                                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] bg-[#0a0a0a]/50 mt-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Terminal className="w-4 h-4 text-violet-400" />
                                                <span className="text-sm font-semibold text-slate-200">Output</span>
                                            </div>
                                            {output && (
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${output.success
                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {output.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {output.success ? 'Success' : 'Error'}
                                                </div>
                                            )}
                                            {output && (
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                                    <Clock className="w-3 h-3" /> {output.duration}ms
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setOutput(null)}
                                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                                                title="Clear"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={toggleMaximize}
                                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                                                title={isMaximized ? "Restore" : "Maximize"}
                                            >
                                                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => setTerminalOpen(false)}
                                                className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                                                title="Close Panel"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-4 overflow-auto font-mono text-sm bg-[#080808]">
                                        {isRunning ? (
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                                                <span>Executing code...</span>
                                            </div>
                                        ) : output ? (
                                            <div className="space-y-4">
                                                {output.stdout && (
                                                    <pre className="text-slate-200 whitespace-pre-wrap text-[13px] leading-relaxed">{output.stdout}</pre>
                                                )}

                                                {output.errors && output.errors.length > 0 && (
                                                    <ErrorDisplay errors={output.errors} rawStderr={output.stderr} />
                                                )}

                                                {output.stderr && (!output.errors || output.errors.length === 0) && (
                                                    <pre className="text-red-400 whitespace-pre-wrap text-[13px] leading-relaxed">{output.stderr}</pre>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 italic">Run your code to see output here...</span>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Status Bar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-t border-white/[0.04] text-xs select-none">
                            <div className="flex items-center gap-4 text-slate-500">
                                <span className="font-mono">{lineCount} lines</span>
                                <span className="font-mono">{code.length} chars</span>
                                <button
                                    onClick={() => setTerminalOpen(!terminalOpen)}
                                    className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
                                >
                                    <Terminal className="w-3 h-3" />
                                    <span>{terminalOpen ? 'Hide' : 'Show'} Output</span>
                                    {terminalOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <FileCode className="w-3.5 h-3.5" />
                                <span className="font-mono">main{selectedLanguage.extension}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Challenges */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20 shadow-2xl shadow-violet-500/10">
                                <Trophy className="w-12 h-12 text-violet-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Coding Challenges</h2>
                            <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
                                Practice with structured problems, pass test cases, and climb the leaderboard.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                {[
                                    { icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Daily Challenges', desc: 'New problem every day' },
                                    { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Test Cases', desc: 'Verify your solutions' },
                                    { icon: Trophy, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Leaderboard', desc: 'Compete with friends' },
                                    { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Problem Library', desc: '100+ curated problems' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors text-left"
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <button className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-400 border border-violet-500/20 font-semibold text-sm cursor-not-allowed inline-flex items-center gap-2 shadow-lg shadow-violet-500/5">
                                <Lock className="w-4 h-4" />
                                Coming Soon
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </main>
    );
}
