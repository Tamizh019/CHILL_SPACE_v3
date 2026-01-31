'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headers
                    h1: ({ node, ...props }) => (
                        <h1 className="text-lg font-bold text-white mb-2 mt-2 pb-1.5 border-b border-violet-500/30" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-base font-bold text-white mb-1.5 mt-2 pb-1 border-b border-violet-500/20" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-sm font-semibold text-white mb-1.5 mt-1.5" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className="text-sm font-semibold text-white mb-1 mt-1.5" {...props} />
                    ),
                    h5: ({ node, ...props }) => (
                        <h5 className="text-xs font-semibold text-slate-200 mb-1 mt-1" {...props} />
                    ),
                    h6: ({ node, ...props }) => (
                        <h6 className="text-xs font-semibold text-slate-300 mb-0.5 mt-1" {...props} />
                    ),

                    // Paragraphs
                    p: ({ node, ...props }) => (
                        <p className="text-xs text-slate-200 mb-1.5 leading-relaxed" {...props} />
                    ),

                    // Bold and Italic
                    strong: ({ node, ...props }) => (
                        <strong className="font-bold text-white" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                        <em className="italic text-violet-200" {...props} />
                    ),

                    // Lists
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside mb-1.5 space-y-0.5 text-slate-200 ml-3" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside mb-1.5 space-y-0.5 text-slate-200 ml-3" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="text-xs leading-relaxed" {...props} />
                    ),

                    // Code blocks
                    code: ({ node, inline, className, children, ...props }: any) => {
                        if (inline) {
                            return (
                                <code
                                    className="px-1.5 py-0.5 mx-0.5 rounded bg-white/10 text-violet-300 text-xs font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code
                                className="block text-xs font-mono text-emerald-400"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    pre: ({ node, ...props }) => (
                        <pre className="my-1.5 p-2 rounded-lg bg-black/50 border border-white/10 overflow-x-auto" {...props} />
                    ),

                    // Blockquotes
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-3 border-violet-500 pl-3 py-0.5 my-1.5 text-xs text-slate-300 italic bg-violet-500/5" {...props} />
                    ),

                    // Links
                    a: ({ node, ...props }) => (
                        <a
                            className="text-violet-400 hover:text-violet-300 underline transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),

                    // Horizontal rule
                    hr: ({ node, ...props }) => (
                        <hr className="my-2 border-t border-white/10" {...props} />
                    ),

                    // Tables
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-1.5">
                            <table className="min-w-full border border-white/10 text-xs" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-white/5" {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="border-b border-white/10" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-2 py-1.5 text-left font-semibold text-white border-r border-white/10 last:border-r-0" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-2 py-1.5 text-slate-200 border-r border-white/10 last:border-r-0" {...props} />
                    ),

                    // Strikethrough (from GFM)
                    del: ({ node, ...props }) => (
                        <del className="line-through text-slate-400" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
