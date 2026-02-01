'use client';

import { useEffect, useCallback } from 'react';

export type ModalVariant = 'danger' | 'warning' | 'info' | 'default';

interface UniversalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: ModalVariant;
    icon?: string;
    showCancel?: boolean;
}

const variantStyles: Record<ModalVariant, { glow: string; confirmBtn: string }> = {
    danger: {
        glow: 'bg-red-500/20',
        confirmBtn: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
    },
    warning: {
        glow: 'bg-amber-500/20',
        confirmBtn: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]'
    },
    info: {
        glow: 'bg-blue-500/20',
        confirmBtn: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]'
    },
    default: {
        glow: 'bg-violet-500/20',
        confirmBtn: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]'
    }
};

export function UniversalModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    showCancel = true
}: UniversalModalProps) {
    const styles = variantStyles[variant];

    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Glow Effect - matching sign-out modal */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${styles.glow} blur-[60px] rounded-full pointer-events-none`} />

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-2 relative z-10">{title}</h3>

                {/* Message */}
                <p className="text-slate-400 text-sm mb-6 relative z-10">{message}</p>

                {/* Buttons - matching sign-out modal style */}
                <div className="flex gap-3 relative z-10">
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onConfirm?.();
                            onClose();
                        }}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${styles.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
