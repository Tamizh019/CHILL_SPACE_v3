import { ComingSoon } from '@/components/ComingSoon';
import { Timer } from 'lucide-react';

export default function FocusPage() {
    return (
        <ComingSoon
            title="Focus Mode"
            description="Boost your productivity with our integrated Pomodoro timer and ambient soundscapes. Detailed statistics and task tracking are being meticulously crafted for this module."
            icon={<Timer className="w-10 h-10 text-emerald-400" />}
        />
    );
}
