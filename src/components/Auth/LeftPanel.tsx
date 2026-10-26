"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Package } from "lucide-react";

export default function LeftPanel() {
  return (
    <div className="h-full relative flex flex-col justify-between overflow-hidden bg-[#0A0E1A] p-6 lg:p-8 xl:p-10 text-white rounded-br-[40px] lg:rounded-br-[70px] dark:bg-[#080B11] dark:border-r dark:border-white/[0.08]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-[#C89B3C]/10 blur-[140px]" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#2D6A8C]/10 blur-[120px]" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-lg border border-[#C89B3C]/30 bg-[#C89B3C]/10 shrink-0">
          <Package size={20} className="text-[#E8C170]" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl xl:text-3xl tracking-[2px] sm:tracking-[3px] uppercase text-[#E8C170] font-heading">
          Chakudee <span className="text-white/90">OrderOS</span>
        </h2>
      </div>

      <div className="relative z-10 my-6 lg:my-0">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/25 bg-white/5 px-3.5 py-1 sm:px-4 sm:py-1.5 font-mono text-xs sm:text-sm uppercase tracking-[2px] text-[#E8C170]">
          Access Terminal
        </span>
        <div className="mt-3 h-px w-24 sm:w-30 bg-gradient-to-r from-[#E8C170] to-transparent" />

        <h1 className="mt-4 sm:mt-6 font-display text-2xl lg:text-3xl xl:text-[2.5rem] 2xl:text-[2.75rem] leading-[1.12] tracking-tight">
          Manage Orders,
          <br />
          <span className="font-serif italic font-normal text-3xl lg:text-4xl xl:text-[2.75rem] 2xl:text-[3.1rem] text-white/60">
            Like Never Before.
          </span>
        </h1>

        <p className="mt-3 sm:mt-5 max-w-sm text-sm sm:text-base xl:text-lg text-white/70 leading-relaxed">
          One terminal to track, fulfill, and reconcile every order from
          checkout to doorstep.
        </p>

      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-white/50">
        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#2D6A8C] shrink-0" />
        <span>Enterprise-grade security</span>
        <span className="text-white/20">•</span>
        <span className="font-mono">99.99% uptime</span>
      </div>
    </div>
  );
}