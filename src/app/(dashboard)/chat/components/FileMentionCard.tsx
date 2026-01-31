'use client';

import { FileRecord } from '@/hooks/useFiles';
import { getFileTypeInfo, formatFileSize, isImage } from '@/utils/fileUtils';

interface FileMentionCardProps {
    file: FileRecord;
    fileUrl?: string | null;
    onClick?: () => void;
    compact?: boolean;
}

export function FileMentionCard({ file, fileUrl, onClick, compact = false }: FileMentionCardProps) {
    const typeInfo = getFileTypeInfo(file.file_type);
    const canPreview = isImage(file.file_type) && fileUrl;

    if (compact) {
        // Inline compact version for chat mentions
        return (
            <button
                onClick={onClick}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-500/20 
                         border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 
                         transition-colors text-sm"
            >
                <span className={`material-icons-round text-sm ${typeInfo.color}`}>
                    {typeInfo.icon}
                </span>
                <span className="font-medium truncate max-w-[150px]">{file.display_name}</span>
            </button>
        );
    }

    // Full card version for message attachments
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] border border-white/10 
                     hover:border-violet-500/30 hover:bg-white/[0.02] transition-all text-left w-full max-w-sm group"
        >
            {/* Preview/Icon */}
            <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {canPreview ? (
                    <img
                        src={fileUrl}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className={`material-icons-round text-2xl ${typeInfo.color}`}>
                        {typeInfo.icon}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate group-hover:text-violet-300 transition-colors">
                    📎 {file.display_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {formatFileSize(file.file_size)} • {file.file_type.split('/')[1]?.toUpperCase() || 'File'}
                    {file.channel && <span> • #{file.channel.name}</span>}
                </p>
            </div>

            {/* Arrow indicator */}
            <span className="material-icons-round text-slate-500 group-hover:text-violet-400 transition-colors">
                chevron_right
            </span>
        </button>
    );
}
