"use client";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />
      <Hero />
    </div>
  );
}
