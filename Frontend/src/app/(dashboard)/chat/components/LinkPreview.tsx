'use client';

import { useState, useEffect } from 'react';

interface LinkPreviewData {
    url: string;
    title: string;
    description: string;
    image: string | null;
    favicon: string | null;
    siteName: string;
}

interface LinkPreviewProps {
    url: string;
}

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

// Extract URLs from message content
export function extractUrls(content: string): string[] {
    const matches = content.match(URL_REGEX);
    return matches || [];
}

export function LinkPreview({ url }: LinkPreviewProps) {
    const [preview, setPreview] = useState<LinkPreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                setLoading(true);
                setError(false);

                // Call our API route to fetch link metadata
                const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);

                if (!response.ok) throw new Error('Failed to fetch preview');

                const data = await response.json();
                setPreview(data);
            } catch (err) {
                console.error('Link preview error:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    if (loading) {
        return (
            <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl animate-pulse">
                <div className="flex gap-3">
                    <div className="w-4 h-4 bg-white/10 rounded" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !preview) {
        // Fallback: show simple link
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm underline"
            >
                <span className="material-icons-round text-sm">link</span>
                {url}
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block p-3 bg-white/5 border border-white/10 rounded-xl 
                       hover:bg-white/[0.07] hover:border-white/20 transition-all group"
        >
            <div className="flex gap-3">
                {/* Favicon */}
                {preview.favicon && (
                    <img
                        src={preview.favicon}
                        alt=""
                        className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                )}

                <div className="flex-1 min-w-0">
                    {/* Site name */}
                    {preview.siteName && (
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                            {preview.siteName}
                        </p>
                    )}

                    {/* Title */}
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-violet-300 transition-colors">
                        {preview.title || new URL(url).hostname}
                    </h4>

                    {/* Description */}
                    {preview.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {preview.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Thumbnail */}
            {preview.image && (
                <div className="mt-3 rounded-lg overflow-hidden">
                    <img
                        src={preview.image}
                        alt={preview.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                </div>
            )}

            {/* URL */}
            <p className="mt-2 text-[10px] text-slate-600 truncate flex items-center gap-1">
                <span className="material-icons-round text-[10px]">link</span>
                {new URL(url).hostname}
            </p>
        </a>
    );
}
