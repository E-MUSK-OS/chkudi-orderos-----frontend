"use client";

import React from "react";
import Link from "next/link";

interface LandingCTAProps {
  isLoggedIn?: boolean;
}

export default function LandingCTA({ isLoggedIn = false }: LandingCTAProps) {
  return (
    <section className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 pb-12 sm:pb-20">
      <div className="rounded-2xl sm:rounded-3xl border border-[#C89B3C]/35 bg-gradient-to-br from-[#FFF9EC] via-white to-[#F6EEDC] dark:from-[#0F1626] dark:via-[#0A0E1A] dark:to-[#080B11] p-6 sm:p-10 lg:p-14 text-center relative overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
        <div className="relative z-10 px-2 sm:px-0">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            Ready to elevate your multi-channel operations?
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Create your account now to connect your marketplace channels or sign in to your active OrderOS terminal.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5">
            <Link
              href={isLoggedIn ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#E8C170] hover:bg-[#d8b05c] text-[#080B11] px-7 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 glow-gold"
            >
              {isLoggedIn ? "Open Dashboard" : "Register Account Free"}
            </Link>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/40 bg-white dark:bg-white/5 text-slate-800 dark:text-white px-7 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs"
            >
              {isLoggedIn ? "Access Terminal" : "Login to Terminal"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
