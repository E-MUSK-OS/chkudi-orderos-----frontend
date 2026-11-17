"use client";

import React from "react";
import { CheckCircle2, Boxes, FileText, Layers, FileSpreadsheet, Users } from "lucide-react";

export default function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-12 sm:py-20 max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 px-2">
        <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
          Core Platform Features
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
          Comprehensive Order & Inventory Management
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
          Every module of Chakudee OrderOS is engineered from real-world manufacturing and fulfillment workflows to eliminate manual errors and streamline multi-channel operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Feature 1 */}
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-[#B88728]/50 dark:hover:border-[#E8C170]/50 transition-all shadow-xs dark:shadow-none group">
          <div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#B88728] dark:text-[#E8C170]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Automated Order Processing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Consolidate orders from Amazon, Myntra, and webstores in one dashboard. Built-in barcode verification compares scanned AWBs against orders to prevent wrong shipments and eliminate customer returns.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono font-semibold text-[#B88728] dark:text-[#E8C170]">
            Zero-Mismatch Dispatch
          </div>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-xs dark:shadow-none group">
          <div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Catalog & Variant SKUs</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage comprehensive product profiles with Master SKU and Sub-SKU mapping, color variants, size curves, and specific rack address assignments for swift physical warehouse picking.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
            Kardex Stock Ledger
          </div>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-xs dark:shadow-none group">
          <div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Offline Sales & GST Invoicing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Full commercial sales pipeline with PO-based uploads, Sales Challans, and statutory GST Sales Invoices that immediately sync with your party ledger book and inventory counts.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
            Commercial Billing Engine
          </div>
        </div>

        {/* Feature 4 */}
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-xs dark:shadow-none group">
          <div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Purchase & Goods Inward</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Track inward procurement from job workers and vendors with Purchase Challans and Purchase Invoices. Cost rates, landing prices, and opening stock are logged automatically.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            Procurement Ledger
          </div>
        </div>

        {/* Feature 5 */}
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all shadow-xs dark:shadow-none group">
          <div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Setting Masters & Excel Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Centralized dropdown governance across 18+ master fields (Brands, Categories, Colors, Racks, Account Heads). Download blank templates and bulk upload thousands of SKUs in seconds.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono font-semibold text-purple-600 dark:text-purple-400">
            High-Speed Data Sync
          </div>
        </div>

        {/* Feature 6 */}
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-xs dark:shadow-none group">
          <div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Financial Ledger & Staff HR</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage multi-branch company profiles, party debit/credit limits, and ledger books. Features integrated employee attendance, monthly wage calculations, and staff wage deductions.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            Complete Business Control
          </div>
        </div>

      </div>
    </section>
  );
}
