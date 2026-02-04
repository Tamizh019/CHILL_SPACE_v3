'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Terminal, Loader2, Trash2,
    Code2, Clock, CheckCircle, XCircle, Lock,
    Trophy, Target, Sparkles, BookOpen, Maximize2, Minimize2,
    AlertTriangle, FileWarning, ChevronDown
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// ============================================================================
// LANGUAGE ICONS (Real SVG Logos)
// ============================================================================

const LanguageIcons = {
    python: () => (
        <svg viewBox="0 0 256 255" className="w-5 h-5">
            <defs>
                <linearGradient id="pythonBlue" x1="12.96%" x2="79.64%" y1="12.04%" y2="78.57%">
                    <stop offset="0%" stopColor="#387EB8" />
                    <stop offset="100%" stopColor="#366994" />
                </linearGradient>
                <linearGradient id="pythonYellow" x1="19.13%" x2="90.58%" y1="20.58%" y2="88.35%">
                    <stop offset="0%" stopColor="#FFE052" />
                    <stop offset="100%" stopColor="#FFC331" />
                </linearGradient>
            </defs>
            <path fill="url(#pythonBlue)" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" />
            <path fill="url(#pythonYellow)" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" />
        </svg>
    ),
    java: () => (
        <svg viewBox="0 0 256 346" className="w-5 h-5">
            <path fill="#5382A1" d="M82.554 267.473s-13.198 7.675 9.393 10.272c27.369 3.122 41.356 2.675 71.517-3.034 0 0 7.93 4.972 19.003 9.279-67.611 28.977-153.019-1.679-99.913-16.517m-8.262-37.814s-14.803 10.958 7.805 13.296c29.236 3.016 52.324 3.263 92.276-4.43 0 0 5.526 5.602 14.215 8.666-81.747 23.904-172.798 1.885-114.296-17.532" />
            <path fill="#E76F00" d="M143.942 165.515c16.66 19.18-4.377 36.44-4.377 36.44s42.301-21.837 22.874-49.183c-18.144-25.5-32.059-38.172 43.268-81.858 0 0-118.238 29.53-61.765 94.6" />
            <path fill="#5382A1" d="M233.364 295.442s9.767 8.047-10.757 14.273c-39.026 11.823-162.432 15.393-196.714.471-12.323-5.36 10.787-12.8 18.056-14.362 7.581-1.644 11.914-1.337 11.914-1.337-13.705-9.655-88.583 18.957-38.034 27.15 137.853 22.356 251.292-10.066 215.535-26.195M88.9 190.48s-62.771 14.91-22.228 20.323c17.118 2.292 51.243 1.774 83.03-.89 25.978-2.19 52.063-6.85 52.063-6.85s-9.16 3.923-15.787 8.448c-63.744 16.765-186.886 8.966-151.435-8.183 29.981-14.492 54.358-12.848 54.358-12.848m112.605 62.942c64.8-33.672 34.839-66.03 13.927-61.67-5.126 1.066-7.411 1.99-7.411 1.99s1.903-2.98 5.537-4.27c41.37-14.545 73.187 42.897-13.355 65.647 0 .001 1.003-.895 1.302-1.697" />
            <path fill="#5382A1" d="M162.439.371s35.887 35.9-34.037 91.101c-56.071 44.282-12.786 69.53-.023 98.377-32.73-29.53-56.75-55.526-40.635-79.72C111.395 74.612 176.918 57.393 162.439.37" />
            <path fill="#5382A1" d="M95.268 344.665c62.199 3.982 157.712-2.209 159.974-31.64 0 0-4.348 11.158-51.404 20.018-53.088 9.99-118.564 8.824-157.399 2.421.001 0 7.95 6.58 48.83 9.201" />
        </svg>
    ),
    javascript: () => (
        <svg viewBox="0 0 256 256" className="w-5 h-5">
            <path fill="#F7DF1E" d="M0 0h256v256H0V0z" />
            <path fill="#000" d="M67.312 213.932l19.59-11.856c3.78 6.701 7.218 12.371 15.465 12.371 7.905 0 12.89-3.092 12.89-15.12v-81.798h24.057v82.138c0 24.917-14.606 36.259-35.916 36.259-19.245 0-30.416-9.967-36.087-21.996m85.07-2.576l19.588-11.341c5.157 8.421 11.859 14.607 23.715 14.607 9.969 0 16.325-4.984 16.325-11.858 0-8.248-6.53-11.17-17.528-15.98l-6.013-2.58c-17.357-7.387-28.87-16.667-28.87-36.257 0-18.044 13.747-31.792 35.228-31.792 15.294 0 26.292 5.328 34.196 19.247l-18.732 12.03c-4.125-7.389-8.591-10.31-15.465-10.31-7.046 0-11.514 4.468-11.514 10.31 0 7.217 4.468 10.14 14.778 14.608l6.014 2.577c20.45 8.765 31.963 17.7 31.963 37.804 0 21.654-17.012 33.51-39.867 33.51-22.339 0-36.774-10.654-43.819-24.574" />
        </svg>
    ),
    typescript: () => (
        <svg viewBox="0 0 256 256" className="w-5 h-5">
            <path fill="#3178C6" d="M0 128V0h256v256H0z" />
            <path fill="#FFF" d="M56.611 128.85l-.081 10.483h33.32v94.68h23.568v-94.68h33.321v-10.28c0-5.69-.122-10.444-.284-10.566-.122-.162-20.399-.244-44.983-.203l-44.739.122-.122 10.443zM206.567 118.108c6.501 1.626 11.459 4.51 16.01 9.224 2.357 2.52 5.851 7.112 6.136 8.209.081.325-11.053 7.802-17.798 11.987-.244.163-1.22-.894-2.317-2.519-3.291-4.795-6.745-6.867-12.028-7.233-7.762-.529-12.759 3.535-12.718 10.321 0 1.992.284 3.17 1.097 4.795 1.707 3.536 4.876 5.649 14.832 9.956 18.326 7.884 26.168 13.085 31.045 20.48 5.445 8.249 6.664 21.415 2.966 31.208-4.063 10.646-14.14 17.879-28.323 20.276-4.388.772-14.79.65-19.504-.203-10.28-1.829-20.033-6.908-26.047-13.572-2.357-2.601-6.949-9.387-6.664-9.875.122-.163 1.178-.813 2.356-1.503 1.138-.65 5.446-3.129 9.509-5.486l7.355-4.267 1.544 2.276c2.154 3.291 6.867 7.802 9.712 9.305 8.167 4.308 19.383 3.698 24.909-1.26 2.357-2.153 3.332-4.388 3.332-7.68 0-2.966-.366-4.266-1.91-6.501-1.99-2.845-6.054-5.242-17.595-10.24-13.206-5.69-18.895-9.224-24.096-14.832-3.007-3.25-5.852-8.452-7.03-12.8-.975-3.617-1.22-12.678-.447-16.335 2.723-12.76 12.353-21.659 26.25-24.3 4.51-.853 14.994-.528 19.424.569z" />
        </svg>
    ),
    rust: () => (
        <svg viewBox="0 0 256 256" className="w-5 h-5">
            <path fill="#000" d="M128 0C57.307 0 0 57.307 0 128s57.307 128 128 128 128-57.307 128-128S198.693 0 128 0z" />
            <path fill="#FFF" d="M121.258 71.06c0-6.017 4.882-10.9 10.9-10.9 6.018 0 10.9 4.883 10.9 10.9 0 6.017-4.882 10.899-10.9 10.899-6.018 0-10.9-4.882-10.9-10.9zm-56.21 81.13h26.88v-26.88h-26.88zm35.88 0h26.88v-26.88h-26.88zm35.88 0h26.88v-26.88h-26.88zm35.88 0h26.88v-26.88h-26.88zM65.048 116.31h26.88v-26.88h-26.88zm35.88 0h26.88v-26.88h-26.88zm35.88 0h26.88v-26.88h-26.88zm35.88 0h26.88v-26.88h-26.88z" />
        </svg>
    ),
    go: () => (
        <svg viewBox="0 0 256 348" className="w-5 h-5">
            <path fill="#00ADD8" d="M47.2 172.6c-2.7 0-4.3-3.3-2.7-5.4l8-10.7c1.3-1.8 3.6-2.9 6.1-2.9h67c2.7 0 4.1 3.1 2.7 5.2l-6.5 10.5c-1.3 2-3.8 3.3-6.1 3.3h-68.5zM.5 203.8c-2.5 0-4.1-3.1-2.5-5.2l8-10.7c1.3-1.8 3.6-2.9 6.1-2.9h85.6c2.5 0 4.1 2.9 2.9 5.1l-3.1 10c-.7 2.3-3.3 4-5.9 4H.5zm76.4 31.2c-2.5 0-4.1-3.3-2.5-5.4l5.4-10.3c1.1-2.2 3.6-3.6 6.1-3.6h38c2.5 0 4.3 2.5 4.1 5.1l-.9 9.6c-.2 2.5-2.3 4.5-4.9 4.5h-45.3zm151-78.8c-17.5 5.2-29.5 9.4-47 14.7-4.1 1.3-4.3 1.4-7.9-2.7-4.3-4.9-7.4-8.1-13.4-11.4-18.2-9.8-35.8-7.2-52.2 4.1-19.6 13.4-29.7 33.2-29.5 57.1.2 23.7 16.7 43.1 40.3 46.2 20.5 2.7 37.8-4.9 51.7-19.8 2.9-3.1 5.4-6.5 8.5-10.3h-56.7c-5.9 0-7.4-3.6-5.4-8.5 3.6-9 10.1-23.9 14-31.4 1.1-2.2 3.6-5.6 8.1-5.6h83.7c-.4 6.1-.4 12.2-1.1 18.3-1.8 16.3-7 31.9-15.6 45.9-14 22.8-33.4 39.1-58.7 47.5-21 7-42.3 7.9-63.1 1.4-19.6-6.1-35.2-17.9-46-35.1-12.7-20.3-15.4-42.1-10.3-64.7 5.6-25 19.6-45.4 39.8-61.2 17.2-13.4 37.2-21 59.2-22.6 18.5-1.4 36.3 1.5 52.6 11.2 10.3 6.1 18.7 14.3 25.7 24.1 1.6 2.2 1.1 3.6-1.6 4.5z" />
        </svg>
    ),
    cpp: () => (
        <svg viewBox="0 0 256 288" className="w-5 h-5">
            <path fill="#00599C" d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76-2.052-3.603-5.125-6.622-9.247-9.009-34.025-19.619-68.083-39.178-102.097-58.817-9.17-5.294-18.061-5.1-27.163.27C100.395 12.39 32.59 51.237.767 69.645c-8.748 5.054-12.722 13.089-12.76 23.034-.09 23.81-.019 47.62-.019 71.43 0 23.775-.07 47.55.019 71.325.039 9.948 4.012 17.986 12.775 23.047 31.819 18.386 63.673 36.72 95.498 55.095 11.226 6.48 22.207 6.588 33.351.131 34.094-19.739 68.238-39.398 102.323-59.154 8.731-5.063 12.685-13.089 12.718-23.02.085-23.808.018-47.617.018-71.426-.001-23.81.067-47.62-.02-71.428" />
            <path fill="#FFF" d="M128.182 143.241L2.988 70.896c-.927 3.013-1.5 6.196-1.5 9.575V207.74c0 9.948 4.012 17.986 12.775 23.047 31.819 18.386 63.673 36.72 95.498 55.095 5.878 3.389 11.652 4.477 17.47 3.49L128.182 143.24" />
            <path fill="#00599C" d="M91.101 164.861c7.238 12.545 19.92 20.988 34.707 20.988 22.468 0 40.678-18.21 40.678-40.678s-18.21-40.678-40.678-40.678c-14.787 0-27.469 7.908-34.52 19.703l-34.871-20.138c14.787-24.76 41.667-41.37 72.606-41.37 46.404 0 84.018 37.614 84.018 84.018 0 46.404-37.614 84.018-84.018 84.018-30.939 0-57.82-16.61-72.606-41.37l34.684-24.493" />
            <path fill="#FFF" d="M195.193 135.235h8.33v17.086h17.087v8.33h-17.086v17.087h-8.331v-17.086h-17.086v-8.33h17.086v-17.087m54.426 0h8.331v17.086h17.086v8.33h-17.086v17.087h-8.33v-17.086H232.53v-8.33h17.09v-17.087" />
        </svg>
    ),
};

// ============================================================================
// LANGUAGES CONFIG  
// ============================================================================

const LANGUAGES = [
    { id: 'python', name: 'Python', IconComponent: LanguageIcons.python, extension: '.py', status: 'available', monacoLang: 'python', defaultCode: '# Write your Python code here\nprint("Hello, Chill Space!")' },
    { id: 'java', name: 'Java', IconComponent: LanguageIcons.java, extension: '.java', status: 'available', monacoLang: 'java', defaultCode: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Chill Space!");\n    }\n}' },
    { id: 'javascript', name: 'JavaScript', IconComponent: LanguageIcons.javascript, extension: '.js', status: 'available', monacoLang: 'javascript', defaultCode: '// Write your JavaScript code here\nconsole.log("Hello, Chill Space!");' },
    { id: 'typescript', name: 'TypeScript', IconComponent: LanguageIcons.typescript, extension: '.ts', status: 'coming_soon', monacoLang: 'typescript', defaultCode: '' },
    { id: 'rust', name: 'Rust', IconComponent: LanguageIcons.rust, extension: '.rs', status: 'coming_soon', monacoLang: 'rust', defaultCode: '' },
    { id: 'go', name: 'Go', IconComponent: LanguageIcons.go, extension: '.go', status: 'coming_soon', monacoLang: 'go', defaultCode: '' },
    { id: 'cpp', name: 'C++', IconComponent: LanguageIcons.cpp, extension: '.cpp', status: 'coming_soon', monacoLang: 'cpp', defaultCode: '' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_CODE_API_URL || 'http://localhost:8080/api/v1';

// Terminal height constraints
const MIN_TERMINAL_HEIGHT = 100;
const MAX_TERMINAL_HEIGHT = 350;
const DEFAULT_TERMINAL_HEIGHT = 160;

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
            errors.push({ type: 'error', title: 'Error', message: stderr.trim() });
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
            errors.push({ type: 'error', title: exMatch?.[1] || 'Exception', message: exMatch?.[2] || stderr });
        } else if (stderr.trim()) {
            errors.push({ type: 'error', title: 'Error', message: stderr.trim() });
        }
    } else {
        const jsErrorMatch = stderr.match(/(TypeError|ReferenceError|SyntaxError|Error):\s*(.+)/);
        if (jsErrorMatch) {
            errors.push({ type: 'error', title: jsErrorMatch[1], message: jsErrorMatch[2] });
        } else if (stderr.trim()) {
            errors.push({ type: 'error', title: 'Error', message: stderr.trim() });
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
                <div key={i} className="rounded-xl overflow-hidden border border-red-500/20 bg-red-500/5">
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
                                    Show traceback
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
                <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-slate-600 hover:text-slate-400">
                    {showRaw ? 'Hide' : 'Show'} raw output
                </button>
            )}
            {showRaw && rawStderr && (
                <pre className="text-xs text-slate-500 font-mono bg-black/30 p-3 rounded-lg overflow-auto max-h-32">{rawStderr}</pre>
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
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<{ stdout: string; stderr: string; duration: number; success: boolean; errors: ParsedError[] } | null>(null);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

    // Terminal state
    const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const previousHeightRef = useRef(DEFAULT_TERMINAL_HEIGHT);

    const editorRef = useRef<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsLangDropdownOpen(false);
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
        setOutput(null);
        setIsLangDropdownOpen(false);
    };

    const handleRun = async () => {
        setIsRunning(true);
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
                stdout: `Hello, Chill Space! [Demo Mode]\n\n⚠️ Backend offline.`,
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

    const availableLanguages = LANGUAGES.filter(l => l.status === 'available');
    const comingSoonLanguages = LANGUAGES.filter(l => l.status === 'coming_soon');

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-3 md:p-6 pt-2 md:pt-4 gap-3 md:gap-4 relative">
            {/* Background Ambient Glows - Smaller on mobile */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full" />
            </div>

            {activeMode === 'playground' ? (
                <>
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between z-10 flex-shrink-0"
                    >
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center border border-white/10">
                                <Code2 className="w-4 h-4 md:w-5 md:h-5 text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">Code Playground</h1>
                                <p className="hidden md:block text-slate-500 text-xs">Write, compile, and run code in your browser</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/5 rounded-full border border-white/5">
                                <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400' : backendStatus === 'offline' ? 'bg-amber-400' : 'bg-slate-500 animate-pulse'}`} />
                                <span className="text-[10px] md:text-xs font-medium text-slate-400">
                                    {backendStatus === 'online' ? 'Connected' : backendStatus === 'offline' ? 'Demo' : '...'}
                                </span>
                            </div>
                            {/* Challenges button - Desktop only */}
                            <button
                                onClick={() => setActiveMode('challenges')}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                            >
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-medium">Challenges</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Editor Section - Full Height */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col z-10 min-h-0"
                    >
                        {/* Editor Container */}
                        <div className="flex-1 rounded-2xl border border-white/10 bg-[#0f0f12] overflow-hidden shadow-2xl flex flex-col min-h-0">
                            {/* Editor Header */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#0a0a0c]">
                                <div className="flex items-center gap-3">
                                    {/* Filename */}
                                    <span className="text-sm font-mono text-slate-400">
                                        main{selectedLanguage.extension}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Language Switcher */}
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-white/10 transition-all"
                                        >
                                            <selectedLanguage.IconComponent />
                                            <span className="text-sm font-medium text-white">{selectedLanguage.name}</span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isLangDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-[#0d0d0d] border border-white/10 shadow-2xl shadow-black/50 z-50 overflow-hidden"
                                                >
                                                    <div className="p-2">
                                                        <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
                                                        </div>
                                                        {availableLanguages.map((lang) => (
                                                            <button
                                                                key={lang.id}
                                                                onClick={() => handleLanguageChange(lang)}
                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-lg mb-0.5 ${selectedLanguage.id === lang.id
                                                                    ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                                                                    : 'text-slate-300 hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <lang.IconComponent />
                                                                <span className="font-medium flex-1 text-left">{lang.name}</span>
                                                                {selectedLanguage.id === lang.id && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="p-2 border-t border-white/5 bg-white/[0.01]">
                                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                            <Clock className="w-3 h-3" /> Coming Soon
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {comingSoonLanguages.map((lang) => (
                                                                <div key={lang.id} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 cursor-not-allowed rounded-lg">
                                                                    <div className="opacity-40"><lang.IconComponent /></div>
                                                                    <span className="font-medium">{lang.name}</span>
                                                                    <Lock className="w-3 h-3 ml-auto" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Run Button */}
                                    <motion.button
                                        onClick={handleRun}
                                        disabled={isRunning || !code.trim()}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all ${isRunning
                                            ? 'bg-violet-500/20 text-violet-300 cursor-wait border border-violet-500/20'
                                            : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/25'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isRunning ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
                                        ) : (
                                            <><Play className="w-4 h-4 fill-current" /> Run Code</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Monaco Editor */}
                            <div className="flex-1 min-h-0">
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
                                        guides: { bracketPairs: true, indentation: true },
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Output Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="relative rounded-2xl border border-white/10 bg-[#0a0a0c] overflow-hidden shadow-2xl z-10 flex-shrink-0"
                        style={{ height: terminalHeight }}
                    >
                        {/* Resize Handle */}
                        <div
                            onMouseDown={handleMouseDown}
                            className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize group z-10 flex items-center justify-center ${isResizing ? 'bg-violet-500/30' : 'hover:bg-violet-500/20'}`}
                        >
                            <div className={`w-12 h-1 rounded-full transition-colors ${isResizing ? 'bg-violet-400' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                        </div>

                        {/* Output Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 mt-2">
                            <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-300">Output</span>
                                {output && (
                                    <>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${output.success ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                            {output.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {output.success ? 'Success' : 'Error'}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">{output.duration}ms</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setOutput(null)} className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300"><Trash2 className="w-3.5 h-3.5" /></button>
                                <button onClick={toggleMaximize} className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300">
                                    {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Output Content */}
                        <div className="p-4 h-[calc(100%-44px)] overflow-auto font-mono text-sm">
                            {isRunning ? (
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                                    <span>Executing code...</span>
                                </div>
                            ) : output ? (
                                <div className="space-y-3">
                                    {output.stdout && <pre className="text-slate-200 whitespace-pre-wrap text-[13px]">{output.stdout}</pre>}
                                    {output.errors && output.errors.length > 0 && <ErrorDisplay errors={output.errors} rawStderr={output.stderr} />}
                                    {output.stderr && (!output.errors || output.errors.length === 0) && <pre className="text-red-400 whitespace-pre-wrap text-[13px]">{output.stderr}</pre>}
                                </div>
                            ) : (
                                <span className="text-slate-600 italic">Run your code to see output here...</span>
                            )}
                        </div>
                    </motion.div>
                </>
            ) : (
                /* Challenges Mode */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
                        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20 shadow-2xl">
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
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                                    className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
                                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => setActiveMode('playground')} className="px-6 py-3 rounded-xl bg-white/5 text-slate-300 border border-white/10 font-semibold text-sm hover:bg-white/10 transition-all">
                                ← Back to Playground
                            </button>
                            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-400 border border-violet-500/20 font-semibold text-sm cursor-not-allowed inline-flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Coming Soon
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
