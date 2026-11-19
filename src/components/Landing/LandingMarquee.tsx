"use client";

import React from "react";

export default function LandingMarquee() {
  const channels = [
    "Your Webstore",
    "Amazon",
    "Myntra",
    "Flipkart",
    "Meesho",
  ];

  // Duplicate for smooth seamless infinite looping
  const marqueeItems = [...channels, ...channels, ...channels, ...channels];

  return (
    <section className="bg-[#FFF9EC]/90 dark:bg-[#070A10] border-y border-[#E7E0D2] dark:border-white/[0.08] py-4 sm:py-5 overflow-hidden transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 text-center mb-2.5">
        <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
          One Terminal For Every Channel
        </span>
      </div>

      <div className="relative w-full overflow-hidden flex select-none">
        {/* Gradient edge masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F7F5F0] dark:from-[#070A10] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F7F5F0] dark:from-[#070A10] to-transparent z-10 pointer-events-none" />

        <div className="flex shrink-0 animate-marquee items-center gap-8 sm:gap-12 text-slate-900 dark:text-white font-bold text-sm sm:text-base tracking-wide">
          {marqueeItems.map((channel, idx) => (
            <div key={idx} className="flex items-center gap-8 sm:gap-12 shrink-0">
              <span className="hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors cursor-default whitespace-nowrap">
                {channel}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B88728] dark:bg-[#E8C170] shrink-0" />
            </div>
          ))}
        </div>

        <div className="flex shrink-0 animate-marquee items-center gap-8 sm:gap-12 text-slate-900 dark:text-white font-bold text-sm sm:text-base tracking-wide ml-8 sm:ml-12" aria-hidden="true">
          {marqueeItems.map((channel, idx) => (
            <div key={`dup-${idx}`} className="flex items-center gap-8 sm:gap-12 shrink-0">
              <span className="hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors cursor-default whitespace-nowrap">
                {channel}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B88728] dark:bg-[#E8C170] shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
