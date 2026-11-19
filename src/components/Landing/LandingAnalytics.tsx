"use client";

import React from "react";

export default function LandingAnalytics() {
  return (
    <section className="py-8 sm:py-12 max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 transition-colors">
      
      {/* 1. Row of 2 Visual Analytics Cards (Dual Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        
        {/* Card 1: Orders this week Area Chart */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Orders this week
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Sample data • All channels
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 shrink-0">
                +18.4% today
              </span>
            </div>

            <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
                1,420
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                orders today
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="mt-4 sm:mt-6 w-full">
            <svg
              viewBox="0 0 500 170"
              className="w-full h-36 sm:h-44 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="orderChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8C170" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#E8C170" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="35" x2="500" y2="35" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" className="text-slate-400 dark:text-white" />
              <line x1="0" y1="85" x2="500" y2="85" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" className="text-slate-400 dark:text-white" />
              <line x1="0" y1="135" x2="500" y2="135" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" className="text-slate-400 dark:text-white" />

              {/* Gradient Area Fill */}
              <path
                d="M 20 130 Q 80 120, 140 125 T 260 100 T 380 75 T 480 35 L 480 155 L 20 155 Z"
                fill="url(#orderChartGrad)"
              />

              {/* Glowing Line Curve */}
              <path
                d="M 20 130 Q 80 120, 140 125 T 260 100 T 380 75 T 480 35"
                fill="none"
                stroke="#C89B3C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Interactive Nodes on Key Days */}
              {[
                { cx: 20, cy: 130 },
                { cx: 90, cy: 122 },
                { cx: 160, cy: 124 },
                { cx: 230, cy: 110 },
                { cx: 300, cy: 92 },
                { cx: 380, cy: 75 },
                { cx: 430, cy: 55 },
                { cx: 480, cy: 35 },
              ].map((point, idx) => (
                <g key={idx}>
                  <circle cx={point.cx} cy={point.cy} r="5" className="fill-white dark:fill-[#080B11]" stroke="#C89B3C" strokeWidth="2.5" />
                </g>
              ))}
            </svg>

            {/* X-Axis Days Labels */}
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 mt-2 px-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Card 2: Orders by channel Donut Chart */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Orders by channel
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  1,420 Total
                </p>
              </div>
            </div>
          </div>

          {/* SVG Donut Graphic */}
          <div className="my-auto py-2 sm:py-4 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100 dark:stroke-white/5"
                  strokeWidth="14"
                  fill="none"
                />
                {/* Amazon Segment (48% ~ 114) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#06B6D4"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray="114 238"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Myntra Segment (30% ~ 71) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#F43F5E"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray="71 238"
                  strokeDashoffset="-118"
                  strokeLinecap="round"
                />
                {/* Webstores Segment (22% ~ 53) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#C89B3C"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray="53 238"
                  strokeDashoffset="-193"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Stat inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                  1,420
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                  orders
                </span>
              </div>
            </div>

            {/* Channel Breakdown Legend */}
            <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Amazon</span>
                <span className="text-slate-500">680</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Myntra</span>
                <span className="text-slate-500">420</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C89B3C]" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Webstores</span>
                <span className="text-slate-500">320</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Dispatch Pipeline Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 mb-6 sm:mb-8 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/30 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 mb-4 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Dispatch pipeline
          </h3>
          <span className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">
            Sample data • Live in the terminal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Progress Bar 1 */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Picklist</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">92%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full w-[92%]" />
            </div>
          </div>

          {/* Progress Bar 2 */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Packed</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">97%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[97%]" />
            </div>
          </div>

          {/* Progress Bar 3 */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Ready to ship</span>
              <span className="font-bold text-[#B88728] dark:text-[#E8C170]">99.8%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-[#E8C170] rounded-full w-[99.8%]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4 Key Stats Metric Boxes (Clean White in Light Mode, Dark in Dark Mode) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-4 sm:p-6 text-left shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#B88728] dark:text-[#E8C170] tracking-tight">
            1,420
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Orders managed today
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-4 sm:p-6 text-left shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#B88728] dark:text-[#E8C170] tracking-tight">
            99.8%
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Dispatch health
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-4 sm:p-6 text-left shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#B88728] dark:text-[#E8C170] tracking-tight">
            6
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Active channels
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-4 sm:p-6 text-left shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#B88728] dark:text-[#E8C170] tracking-tight">
            99.99%
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Platform uptime
          </p>
        </div>
      </div>

    </section>
  );
}
