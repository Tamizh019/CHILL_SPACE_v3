"use client";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />
      <Hero />
      <div className="fixed bottom-4 right-4 z-[50]">
        <a href="/home" className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors px-3 py-1 rounded-full border border-white/5 hover:border-white/20 backdrop-blur-sm">
          Test: Home Dashboard
        </a>
      </div>
    </div>
  );
}
