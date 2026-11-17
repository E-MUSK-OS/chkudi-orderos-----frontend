"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, Package } from "lucide-react";

export default function LandingHero() {
  const [activeMockChannel, setActiveMockChannel] = useState<"all" | "amazon" | "myntra" | "webstore">("all");

  return (
    <section className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 overflow-hidden">
      {/* Ambient Light Halos */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[350px] sm:w-[650px] h-[220px] sm:h-[380px] bg-[#E8C170]/15 dark:bg-[#E8C170]/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#2D6A8C]/10 dark:bg-[#2D6A8C]/15 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center">
        
        {/* Eyebrow Status Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#C89B3C]/40 bg-[#FFF9EC] dark:bg-[#C89B3C]/10 px-3 py-1 sm:px-4 sm:py-1.5 mb-5 sm:mb-6 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[1px] sm:tracking-[2px] text-[#B88728] dark:text-[#E8C170] shadow-xs max-w-full">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B88728] dark:bg-[#E8C170] animate-pulse shrink-0" />
          <span className="truncate">Enterprise Multi-Marketplace OS</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] max-w-5xl xl:max-w-6xl mx-auto text-slate-900 dark:text-white">
          Manage Orders, Inventory & Dispatch
          <span className="block mt-1 italic font-serif font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#B88728] via-slate-800 to-slate-600 dark:from-[#E8C170] dark:via-white dark:to-slate-300">
            Like Never Before.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 text-xs sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-4xl xl:max-w-5xl mx-auto font-normal leading-relaxed px-2 sm:px-0">
          The centralized commerce terminal built to automate order reconciliation, variant catalog inventory, and multi-channel fulfillment across Amazon, Myntra, Flipkart, Meesho, and custom webstores.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#E8C170] hover:bg-[#d8b05c] text-[#080B11] px-7 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm md:text-base font-extrabold shadow-lg transition-all active:scale-95 glow-gold"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm md:text-base font-bold transition-all active:scale-95 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 mr-2 text-[#B88728] dark:text-[#E8C170]" />
            Access Terminal
          </Link>
        </div>

        {/* Trust Guarantees */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 px-2">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2D6A8C] shrink-0" />
            <span>TLS Encryption</span>
          </div>
          <span className="hidden sm:inline-block text-slate-400 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>99.99% Uptime</span>
          </div>
          <span className="hidden sm:inline-block text-slate-400 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span>Multi-Channel Sync</span>
          </div>
        </div>

        {/* Product Terminal Mockup Window (Adaptive Light & Dark UI) */}
        <div className="mt-8 sm:mt-14 relative max-w-5xl xl:max-w-6xl 2xl:max-w-[1360px] mx-auto rounded-xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/10 bg-white dark:bg-[#0F1626] p-2.5 sm:p-5 shadow-xl dark:shadow-2xl transition-colors text-left overflow-hidden">
          
          {/* Terminal Window Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 sm:pb-3 mb-3 sm:mb-4 border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400 dark:bg-rose-500/80 inline-block shadow-2xs" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 dark:bg-amber-500/80 inline-block shadow-2xs" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 dark:bg-emerald-500/80 inline-block shadow-2xs" />
              </div>
              <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[160px] sm:max-w-none">
                OrderOS v2.4 • Dispatch Center
              </span>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[9px] sm:text-xs font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYNC ACTIVE
              </span>
            </div>
          </div>

          {/* Interactive Channel Filter Tabs inside the Mockup */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mr-1 uppercase hidden xs:inline-block">
              Filter:
            </span>
            {[
              { id: "all", label: "All", count: "1,420" },
              { id: "amazon", label: "Amazon", count: "680" },
              { id: "myntra", label: "Myntra", count: "420" },
              { id: "webstore", label: "Webstores", count: "320" },
            ].map((tab) => {
              const isActive = activeMockChannel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMockChannel(tab.id as "all" | "amazon" | "myntra" | "webstore")}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#E8C170] text-[#080B11] shadow-xs"
                      : "bg-[#FAF8F5] dark:bg-[#0A0E1A] text-slate-600 dark:text-slate-300 border border-[#E7E0D2] dark:border-white/[0.08] hover:border-[#B88728]/40"
                  }`}
                >
                  {tab.label} <span className="opacity-75">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Terminal Internal Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-0.5 sm:p-1">
            <div className="bg-[#FAF8F5] dark:bg-[#0A0E1A] rounded-lg sm:rounded-2xl p-2.5 sm:p-4 border border-[#E7E0D2] dark:border-white/[0.06] shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
              <p className="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold truncate">
                {activeMockChannel === "amazon"
                  ? "Amazon"
                  : activeMockChannel === "myntra"
                  ? "Myntra"
                  : activeMockChannel === "webstore"
                  ? "Webstore"
                  : "Total Orders"}
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {activeMockChannel === "amazon"
                  ? "680"
                  : activeMockChannel === "myntra"
                  ? "420"
                  : activeMockChannel === "webstore"
                  ? "320"
                  : "1,420"}
              </p>
              <span className="inline-block mt-0.5 text-[9px] sm:text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                +18.4% today
              </span>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#0A0E1A] rounded-lg sm:rounded-2xl p-2.5 sm:p-4 border border-[#E7E0D2] dark:border-white/[0.06] shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
              <p className="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold truncate">
                Dispatch Health
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                99.8%
              </p>
              <span className="inline-block mt-0.5 text-[9px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
                0 Mismatches
              </span>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#0A0E1A] rounded-lg sm:rounded-2xl p-2.5 sm:p-4 border border-[#E7E0D2] dark:border-white/[0.06] shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
              <p className="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold truncate">
                Channels
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#B88728] dark:text-[#E8C170] mt-1">
                6 Active
              </p>
              <span className="inline-block mt-0.5 text-[9px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
                SP-API & Stores
              </span>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#0A0E1A] rounded-lg sm:rounded-2xl p-2.5 sm:p-4 border border-[#E7E0D2] dark:border-white/[0.06] shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
              <p className="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold truncate">
                SKUs Mapped
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                1,420
              </p>
              <span className="inline-block mt-0.5 text-[9px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Rack Synced
              </span>
            </div>
          </div>

          {/* Live Order Dispatch Verification Feed */}
          <div className="mt-3 sm:mt-4 bg-[#FAF8F5] dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.06] rounded-lg sm:rounded-2xl p-2.5 sm:p-4">
            <div className="flex items-center justify-between pb-2 mb-2 sm:pb-2.5 sm:mb-3 border-b border-[#E7E0D2] dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B88728] dark:text-[#E8C170]" />
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-white">
                  Live Dispatch Verification Feed
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Real-Time Log
              </span>
            </div>

            {/* Feed Items */}
            <div className="space-y-1.5 sm:space-y-2 text-xs">
              {/* Item 1 */}
              {(activeMockChannel === "all" || activeMockChannel === "amazon") && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#0A0E1A] border border-[#E7E0D2]/70 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shrink-0">
                      AMZ
                    </span>
                    <div className="min-w-0 truncate">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs">OD-AMZ-9941</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px] sm:text-xs truncate">Georgette Kurta (M)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] shrink-0">
                    <span className="font-mono text-slate-500 dark:text-slate-400">Rack: A-04</span>
                    <span className="px-2 py-0.5 rounded-full font-mono text-[9px] sm:text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                      ✓ PACKED
                    </span>
                  </div>
                </div>
              )}

              {/* Item 2 */}
              {(activeMockChannel === "all" || activeMockChannel === "myntra") && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#0A0E1A] border border-[#E7E0D2]/70 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 shrink-0">
                      MYN
                    </span>
                    <div className="min-w-0 truncate">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs">MYN-4921093</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px] sm:text-xs truncate">Anarkali Gown (L)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] shrink-0">
                    <span className="font-mono text-slate-500 dark:text-slate-400">Rack: B-12</span>
                    <span className="px-2 py-0.5 rounded-full font-mono text-[9px] sm:text-[10px] font-bold bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
                      ✓ PICKLIST
                    </span>
                  </div>
                </div>
              )}

              {/* Item 3 */}
              {(activeMockChannel === "all" || activeMockChannel === "webstore") && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#0A0E1A] border border-[#E7E0D2]/70 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                      WEB
                    </span>
                    <div className="min-w-0 truncate">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs">WEB-8812041</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px] sm:text-xs truncate">Printed Saree (Free)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] shrink-0">
                    <span className="font-mono text-slate-500 dark:text-slate-400">Rack: C-02</span>
                    <span className="px-2 py-0.5 rounded-full font-mono text-[9px] sm:text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                      ✓ READY
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
