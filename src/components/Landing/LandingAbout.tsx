"use client";

import React from "react";

export default function LandingAbout() {
  return (
    <section id="about" className="scroll-mt-24 py-12 sm:py-20 border-t border-[#E7E0D2] dark:border-white/[0.08] max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
            Our Story & Mission
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
            Crafted for Merchants, by Operators Who Lived the Problem
          </h2>
          <p className="mt-4 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            OrderOS was founded by <strong className="text-slate-900 dark:text-white font-bold">Chakudee Fashion Pvt Ltd</strong> out of an urgent need: managing tens of thousands of orders across Amazon, Myntra, Flipkart, and physical sales channels with spreadsheets and disconnected portals was broken.
          </p>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Mismatched shipments, delayed picklists, unrecorded stock movements, and inaccurate ledger reconciliations cost sellers millions. We built OrderOS from the ground up as a single, unified operating system that fuses catalog management, live marketplace sync, warehouse rack addressing, and complete commercial accounting into one terminal.
          </p>

          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-200 dark:border-white/[0.08] pt-5 sm:pt-6">
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">100K+</p>
              <p className="text-[10px] sm:text-xs font-mono text-slate-500 mt-1 uppercase">Orders Dispatched</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#B88728] dark:text-[#E8C170]">99.8%</p>
              <p className="text-[10px] sm:text-xs font-mono text-slate-500 mt-1 uppercase">Accuracy Rate</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400">Zero</p>
              <p className="text-[10px] sm:text-xs font-mono text-slate-500 mt-1 uppercase">Dispatch Errors</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-[#C89B3C]/30 bg-gradient-to-br from-[#FFF9EC] via-white to-[#F5EEDD] dark:from-[#0F1626] dark:via-[#0A0E1A] dark:to-[#080B11] p-5 sm:p-8 lg:p-10 shadow-sm dark:shadow-xl">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-4">Core Operating Principles</h3>
          <div className="space-y-4 sm:space-y-5">
            <div className="flex gap-3 sm:gap-4">
              <div className="h-8 w-8 rounded-lg bg-[#E8C170]/20 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                01
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Single Source of Truth</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  One master catalog connects all sub-SKUs, variant pricing, opening stock, and warehouse rack locations.
                </p>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="h-8 w-8 rounded-lg bg-[#E8C170]/20 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                02
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Real-Time Verification</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Every package is scanned and validated against live marketplace orders before leaving your fulfillment floor.
                </p>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="h-8 w-8 rounded-lg bg-[#E8C170]/20 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                03
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Audited Financial Governance</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Integrated debit/credit ledgers, GST sales invoicing, and salaried employee attendance built right into your workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
