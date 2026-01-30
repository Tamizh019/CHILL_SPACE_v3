import Link from 'next/link';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Left Sidebar - Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />

                {/* Page Content */}
                {children}
            </div>
        </div>
    );
}
