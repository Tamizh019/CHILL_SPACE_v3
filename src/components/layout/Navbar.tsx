"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export const Navbar = () => {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-5"
        >
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group font-sans">
                    <div className="w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <img src="/logo1.svg" alt="Chill Space Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center">

                        <span
                            className="text-white/50 text-xl tracking-tighter"
                            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 200 }}
                        >
                            chill
                        </span>
                        <span
                            className="text-white text-xl tracking-tighter font-bold ml-1"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            space
                        </span>
                        <motion.div
                            animate={{
                                opacity: [1, 0.4, 1],
                                scale: [1, 1.3, 1],
                                boxShadow: [
                                    "0 0 10px rgba(139,92,246,0.4)",
                                    "0 0 20px rgba(139,92,246,0.8)",
                                    "0 0 10px rgba(139,92,246,0.4)"
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1.5 h-1.5 rounded-full bg-violet-500 ml-1.5 mt-1"
                        />
                    </div>
                </Link>

                {/* Right Side */}
                <div className="flex items-center gap-6">
                    <Link href="/login">
                        <button className="px-5 py-2 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-300">
                            Login
                        </button>
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
};
