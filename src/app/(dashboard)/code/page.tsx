import { ComingSoon } from '@/components/ComingSoon';
import { Code2 } from 'lucide-react';

export default function CodePage() {
    return (
        <ComingSoon
            title="Code Editor"
            description="A powerful, collaborative code editor engineered for seamless pair programming. Features will include real-time syntax highlighting, multi-language support, and integrated terminal access."
            icon={<Code2 className="w-10 h-10 text-violet-400" />}
        />
    );
}
