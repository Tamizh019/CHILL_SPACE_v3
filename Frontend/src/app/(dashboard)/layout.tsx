import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

import { FocusProvider } from '@/context/FocusContext';
import { RecentActivityProvider } from '@/context/RecentActivityContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FocusProvider>
            <RecentActivityProvider>
                <div className="flex h-[100dvh] bg-black text-white overflow-hidden">
                    {/* Ambient Background */}
                    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
                        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" />
                    </div>

                    {/* Left Sidebar - Hidden on mobile */}
                    <div className="hidden md:block">
                        <Sidebar />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
                        {/* Header */}
                        <Header />

                        {/* Page Content */}
                        {children}
                    </div>

                    {/* Bottom Navigation - Mobile Only */}
                    <BottomNav />
                </div>
            </RecentActivityProvider>
        </FocusProvider>
    );
}

