"use client";

import React from "react";
import { Check } from "lucide-react";

export default function LandingMarketplaces() {
  return (
    <section id="marketplaces" className="scroll-mt-24 py-12 sm:py-20 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-white/50 dark:bg-[#0A0E1A]/40 transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 px-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
            Direct Integrations
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
            Seamless Channel Synchronization
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            Native connectors for India's leading e-commerce marketplaces and webstores. Automate the end-to-end journey from buyer checkout to warehouse dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Amazon */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  SP-API
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">Amazon</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Direct connection to Amazon SP-API. Automated AWB barcode scanning, live order reconciliation, order status comparisons, and zero-error packaging checks.
              </p>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  AWB Scan & Verification
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Order Processing Result Diff
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Product Performance Analytics
                </li>
              </ul>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono text-slate-500">
              Channel: Direct SP-API
            </div>
          </div>

          {/* Myntra */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Omnichannel
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">Myntra Partner</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Comprehensive Myntra fulfillment workflow with native support for Tag Loop tracking, Picklist generation, batch invoice formatting, and stock health analysis.
              </p>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Manage Tag Loop Tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Myntra Order Picklists
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Tax Invoice Formatter Engine
                </li>
              </ul>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono text-slate-500">
              Channel: Omnichannel & M-Direct
            </div>
          </div>

          {/* Flipkart & Meesho */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Mass Retail
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">Flipkart & Meesho</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                High-volume sales management with Sub-SKU mapping to prevent overselling. Centralized inventory allocation allows safe multi-listing across both platforms.
              </p>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Multi-Store Sub-SKU Mapping
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Centralized Stock Buffer
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Bulk Order Import Engine
                </li>
              </ul>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono text-slate-500">
              Channel: Unified Webstore Engine
            </div>
          </div>

          {/* Custom Webstores */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Custom Stores
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">Webstores & Dropship</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Connect private branded e-commerce stores and dropship partner accounts. Manage custom SKU catalogs, download listing snapshots, and toggle active channels in one click.
              </p>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Direct Listing Download
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  1-Click Store Toggle Control
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Drop-shipping SKU Routing
                </li>
              </ul>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono text-slate-500">
              Channel: Custom API / Excel Webstore
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
