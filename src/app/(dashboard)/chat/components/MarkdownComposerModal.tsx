'use client';

import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownComposerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (content: string) => void;
}

export function MarkdownComposerModal({ isOpen, onClose, onSend }: MarkdownComposerModalProps) {
    const [markdownContent, setMarkdownContent] = useState('');

    if (!isOpen) return null;

    const handleSend = () => {
        if (markdownContent.trim()) {
            onSend(markdownContent);
            setMarkdownContent('');
            onClose();
        }
    };

    const handleClose = () => {
        setMarkdownContent('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="material-icons-round text-violet-400 text-2xl">edit_note</span>
                        <div>
                            <h2 className="text-lg font-bold text-white">Markdown Composer</h2>
                            <p className="text-xs text-slate-400">Write or paste your markdown content</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>

                {/* Split Pane Content */}
<div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
                    {/* Editor Pane */}
                    <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center gap-2">
                            <span className="material-icons-round text-slate-400 text-sm">code</span>
                            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Editor</span>
                        </div>

                        {/* Textarea with Custom Placeholder */}
                        <div className="relative flex-1">
                            {!markdownContent && (
                                <div className="absolute inset-0 p-4 pointer-events-none text-sm text-slate-600 font-mono leading-relaxed whitespace-pre-line">
                                    {`# Start typing...
Use Markdown to format your message ✨

**Bold** *Italic* ~~Strike~~
## Headings
Use # for titles, ## for subtitles

### Lists
- Bullet points
- Numbered items

### Code
Inline \`code\` or blocks:
\`\`\`javascript
const example = 'Hello World';
\`\`\`
✨ Preview on the right →`}
                                </div>
                            )}
                            <textarea
                                value={markdownContent}
                                onChange={(e) => setMarkdownContent(e.target.value)}
                                className="w-full h-full p-4 bg-transparent text-sm text-slate-200 font-mono resize-none focus:outline-none leading-relaxed"
                                autoFocus
                            />
                        </div>
                    </div>
                    {/* Preview Pane */}
                    <div className="flex-1 flex flex-col">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center gap-2">
                            <span className="material-icons-round text-violet-400 text-sm">visibility</span>
                            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Live Preview</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            {markdownContent.trim() ? (
                                <MarkdownRenderer content={markdownContent} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    <div className="text-center">
                                        <span className="material-icons-round text-4xl mb-2 opacity-50">preview</span>
                                        <p>Preview will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="material-icons-round text-sm">info</span>
                        <span>Supports GitHub-flavored markdown</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!markdownContent.trim()}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                ${markdownContent.trim()
                                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-icons-round text-lg">send</span>
                            Send Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
