'use client';

interface JumpToLatestProps {
    show: boolean;
    newMessageCount: number;
    onClick: () => void;
}

export function JumpToLatest({ show, newMessageCount, onClick }: JumpToLatestProps) {
    if (!show) return null;

    return (
        <button
            onClick={onClick}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 
                       flex items-center gap-2 px-4 py-2.5 
                       bg-violet-600 hover:bg-violet-500 
                       text-white text-sm font-medium 
                       rounded-full shadow-lg shadow-violet-500/30
                       transform transition-all duration-300 ease-out
                       hover:scale-105 active:scale-95
                       animate-bounce-subtle"
        >
            <span className="material-icons-round text-lg">arrow_downward</span>
            <span>
                Jump to present
                {newMessageCount > 0 && (
                    <span className="ml-1 text-violet-200">
                        ({newMessageCount} new)
                    </span>
                )}
            </span>
        </button>
    );
}
