import { ComingSoon } from '@/components/ComingSoon';
import { Palette } from 'lucide-react';

export default function CanvasPage() {
    return (
        <ComingSoon
            title="Creative Canvas"
            description="Your infinite workspace for brainstorming, wireframing, and visual collaboration. Expect whiteboard tools, sticky notes, and real-time drawing capabilities coming your way soon."
            icon={<Palette className="w-10 h-10 text-pink-400" />}
        />
    );
}
