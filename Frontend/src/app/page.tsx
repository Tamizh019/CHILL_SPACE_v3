"use client";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import ScrollProgressBar from "@/components/ScrollProgressBar";

export default function Home() {
  return (
    <SmoothScrollProvider>
      <ScrollProgressBar />
      <div className="relative w-full min-h-screen overflow-hidden bg-background text-foreground">
        <Navbar />
        <Hero />
      </div>
    </SmoothScrollProvider>
  );
}
