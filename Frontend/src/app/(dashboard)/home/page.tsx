'use client';

import { GreetingSection } from './components/GreetingSection';
import { StatsCards } from './components/StatsCards';
import { JumpBackIn } from './components/JumpBackIn';
import { RightSidebar } from './components/RightSidebar';

export default function HomePage() {
    return (
        <main className="flex-1 flex overflow-hidden p-8 gap-8">
            {/* Center Content - No Scrollbar, Fit to Screen */}
            <section className="flex-1 flex flex-col gap-8 overflow-hidden max-w-7xl mx-auto w-full">
                <GreetingSection />
                <StatsCards />
                <JumpBackIn />
            </section>

            {/* Right Sidebar */}
            <RightSidebar />
        </main>
    );
}
