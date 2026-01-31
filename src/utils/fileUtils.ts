// File utility functions for Chill Space v3

export interface FileTypeInfo {
    icon: string;
    color: string;
    category: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';
}

// Get icon and color for file type
export function getFileTypeInfo(mimeType: string): FileTypeInfo {
    if (mimeType.startsWith('image/')) {
        return { icon: 'image', color: 'text-emerald-400', category: 'image' };
    }
    if (mimeType.startsWith('video/')) {
        return { icon: 'movie', color: 'text-purple-400', category: 'video' };
    }
    if (mimeType.startsWith('audio/')) {
        return { icon: 'headphones', color: 'text-pink-400', category: 'audio' };
    }
    if (mimeType === 'application/pdf') {
        return { icon: 'picture_as_pdf', color: 'text-red-400', category: 'document' };
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
        return { icon: 'description', color: 'text-blue-400', category: 'document' };
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
        return { icon: 'table_chart', color: 'text-green-400', category: 'document' };
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return { icon: 'slideshow', color: 'text-orange-400', category: 'document' };
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('compressed')) {
        return { icon: 'folder_zip', color: 'text-yellow-400', category: 'archive' };
    }
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') ||
        mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('python') ||
        mimeType.includes('java') || mimeType.includes('text/plain')) {
        return { icon: 'code', color: 'text-cyan-400', category: 'code' };
    }
    return { icon: 'insert_drive_file', color: 'text-slate-400', category: 'other' };
}

// Format file size to human readable
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

// Check if file can be previewed inline
export function isPreviewable(mimeType: string): boolean {
    return mimeType.startsWith('image/') ||
        mimeType.startsWith('video/') ||
        mimeType === 'application/pdf';
}

// Check if file is an image
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

// Check if file is a video
export function isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

// Generate a unique storage path for a file
export function generateStoragePath(userId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${timestamp}_${sanitizedName}`;
}

// Get relative time string (e.g., "2 hours ago")
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Validate file size (max 50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export function validateFileSize(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
        };
    }
    return { valid: true };
}

// Get MIME type category for filtering
export function getFileCategory(mimeType: string): string {
    const info = getFileTypeInfo(mimeType);
    return info.category;
}

// Search files by name
export function filterFilesBySearch<T extends { display_name: string; original_filename: string }>(
    files: T[],
    query: string
): T[] {
    const lowerQuery = query.toLowerCase();
    return files.filter(file =>
        file.display_name.toLowerCase().includes(lowerQuery) ||
        file.original_filename.toLowerCase().includes(lowerQuery)
    );
}
