'use client';

interface TypingIndicatorProps {
    typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
    if (typingUsers.length === 0) return null;

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} is typing`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
        } else if (typingUsers.length === 3) {
            return `${typingUsers[0]}, ${typingUsers[1]}, and ${typingUsers[2]} are typing`;
        } else {
            return `${typingUsers.length} people are typing`;
        }
    };

    return (
        <div className="flex items-center gap-2 px-6 py-2 text-slate-400 text-xs animate-fade-in">
            {/* Animated dots */}
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="italic">{getTypingText()}</span>
        </div>
    );
}
