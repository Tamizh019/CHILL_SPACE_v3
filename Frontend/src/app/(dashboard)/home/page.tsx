'use client';

import { GreetingSection } from './components/GreetingSection';
import { StatsCards } from './components/StatsCards';
import { JumpBackIn } from './components/JumpBackIn';
import { RightSidebar } from './components/RightSidebar';

export default function HomePage() {
    return (
        <main className="flex-1 flex overflow-hidden p-4 md:p-8 gap-4 md:gap-8">
            {/* Center Content - Scrollable on mobile */}
            <section className="flex-1 flex flex-col gap-4 md:gap-8 overflow-y-auto max-w-7xl mx-auto w-full">
                <GreetingSection />
                <StatsCards />
                <JumpBackIn />
            </section>

            {/* Right Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
                <RightSidebar />
            </div>
        </main>
    );
}

