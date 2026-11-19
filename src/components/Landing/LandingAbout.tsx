"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Layers,
  Video,
  FileSpreadsheet,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Lock,
  Server,
} from "lucide-react";

export default function LandingAbout() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "2383elonmusk@gmail.com";

  return (
    <div className="py-8 sm:py-16 max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 transition-colors">
      
      {/* 1. Header / Intro Story Section */}
      <section className="mb-14 sm:mb-20 text-center max-w-4xl mx-auto px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#C89B3C]/40 bg-[#FFF9EC] dark:bg-[#C89B3C]/10 px-3 py-1 sm:px-4 sm:py-1.5 mb-4 sm:mb-6 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C170]" />
          <span>About Chakudee OrderOS</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          Empowering Multi-Channel Commerce
        </h1>

        <p className="mt-4 sm:mt-6 text-xs sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          OrderOS is the centralized commerce terminal and warehouse execution operating system engineered by{" "}
          <strong className="text-slate-900 dark:text-white font-semibold">Chakudee Fashion Pvt Ltd</strong> in Surat, Gujarat — the epicenter of India’s textile and fashion manufacturing. We unify marketplace channels, inventory racks, thermal label printing, and statutory accounting into one single platform.
        </p>

        {/* Live Operational Metrics */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-3 sm:p-4 lg:p-5 text-center shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col items-center justify-center">
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#B88728] dark:text-[#E8C170] whitespace-nowrap">100K+</p>
            <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase mt-1">Dispatches Processed</p>
          </div>
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-3 sm:p-4 lg:p-5 text-center shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col items-center justify-center">
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">99.8%</p>
            <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase mt-1">Fulfillment Accuracy</p>
          </div>
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-3 sm:p-4 lg:p-5 text-center shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col items-center justify-center">
            <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#B88728] dark:text-[#E8C170] whitespace-nowrap">6+ Channels</p>
            <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase mt-1">APIs & Webstores</p>
          </div>
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-3 sm:p-4 lg:p-5 text-center shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col items-center justify-center">
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-600 dark:text-cyan-400 whitespace-nowrap">99.99%</p>
            <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase mt-1">Uptime SLA</p>
          </div>
        </div>
      </section>

      {/* 2. The Problem We Solved (Real Story) */}
      <section className="mb-14 sm:mb-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
              The Genesis
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
              Why We Built OrderOS
            </h2>
            <p className="mt-4 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Every day, thousands of garment manufacturers, apparel brands, and retail merchants across Surat and India face a logistical nightmare. Managing separate seller portals for Amazon, Myntra, Flipkart, and Meesho while relying on disconnected Excel sheets creates expensive chaos:
            </p>
            <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C170] shrink-0 mt-0.5" />
                <span><strong>Overselling & Out of Stock Penalties:</strong> Inventory sold on Amazon wasn’t instantly deducted on Myntra or Flipkart.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C170] shrink-0 mt-0.5" />
                <span><strong>Wrong Item Shipments:</strong> Similar looking apparel variants dispatched with wrong sizes or colors, causing massive RTO fees.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C170] shrink-0 mt-0.5" />
                <span><strong>Courier Fraud & Return Disputes:</strong> Empty box returns and false courier weight claims with no visual proof to dispute them.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C170] shrink-0 mt-0.5" />
                <span><strong>Thermal Printing Bottlenecks:</strong> Tedious browser print dialogs slowing down packing operators on thermal label printers.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E7E0D2] dark:border-white/[0.08]">
            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 italic">
              &quot;We built OrderOS not in an abstract boardroom, but on active warehouse packing tables in Surat where every second and every SKU counts.&quot;
            </p>
          </div>
        </div>

        {/* Core Principles Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#C89B3C]/35 bg-gradient-to-br from-[#FFF9EC] via-white to-[#F5EEDD] dark:from-[#0F1626] dark:via-[#0A0E1A] dark:to-[#080B11] p-6 sm:p-8 lg:p-10 shadow-xs dark:shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-5">
              Our Core Operating Principles
            </h3>

            <div className="space-y-4 sm:space-y-5">
              <div className="flex gap-3 sm:gap-4">
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/15 border border-[#C89B3C]/30 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                  01
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Unified Master Catalog</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Single source of truth linking style codes, colors, sizes, barcode mappings, and physical rack/bin coordinates.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/15 border border-[#C89B3C]/30 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                  02
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Zero-Mismatch Dispatch</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Every SKU is barcode-scanned and validated against the marketplace order manifest before shipping labels can be printed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/15 border border-[#C89B3C]/30 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                  03
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Tamper-Proof Video Evidence</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    VMS technology pairs high-definition packaging video recordings directly with AWB tracking numbers to win 100% of dispute claims.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/15 border border-[#C89B3C]/30 flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C170] font-bold font-mono text-xs sm:text-sm">
                  04
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Statutory Financial Integrity</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Automated GST tax compliance (CGST/SGST/IGST), HSN invoice generation, and double-entry merchant ledger books.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. True Software Capabilities & Modules */}
      <section className="mb-14 sm:mb-20">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 px-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
            Complete Software Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
            Built-In Modules Driving the Terminal
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            OrderOS is an all-in-one suite covering every step from order receipt to customer doorstep delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
          {/* Module 1 */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                Multi-Marketplace API Engine
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Direct native API integration with Amazon SP-API, Myntra Omnichannel, Flipkart Seller, Meesho, and custom webstores (Shopify/WooCommerce). Live automated sync for orders, cancellations, and status updates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C170]">
              SP-API • Webhooks • Auto-Sync
            </div>
          </div>

          {/* Module 2 */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                Variant Catalog & Rack Mapping
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Comprehensive matrix for parent styles and sub-SKUs (colorways, size scales, fabrics, HSN codes). Physical warehouse shelf and bin mapping enables operators to locate products in seconds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C170]">
              Rack Addressing • SKU Mapping • Barcodes
            </div>
          </div>

          {/* Module 3 */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-4">
                <PackageCheck className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                Smart Picklist & Verification
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Optimized batch picklists grouped by rack corridor. Live barcode scanner integration verifies every parcel at the workstation before marking as packed or handed over to logistics partners.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C170]">
              Batch Picklists • Scan Verification • 0 Mismatches
            </div>
          </div>

          {/* Module 4 */}
          <div className="lg:col-span-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-4">
                <Video className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                VMS Video Monitoring System
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                High-definition workstation video recording paired automatically with parcel AWB numbers. Provides tamper-proof visual proof to overturn courier weight discrepancies and bogus buyer return claims.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C170]">
              AWB Video Sync • Return Protection • Workstations
            </div>
          </div>

          {/* Module 5 */}
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                GST Invoicing & Ledger Book
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Comprehensive statutory accounting built directly into your dispatches. Generates GST B2B/B2C tax invoices, e-Way bills, sales challans, credit notes, and an audited double-entry ledger book.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C170]">
              GST Aligned • CGST/SGST/IGST • Ledger Books
            </div>
          </div>
        </div>
      </section>

      {/* 4. Enterprise Security & Architecture Section */}
      <section className="mb-14 sm:mb-20 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-1">
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
              Security by Design
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
              Enterprise Data Protection
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your catalog margins, customer shipping addresses, supplier prices, and marketplace tokens are strictly guarded with bank-grade standards.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E7E0D2]/60 dark:border-white/[0.06] bg-[#FAF8F5] dark:bg-[#0A0E1A] p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
                <Lock className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
                Multi-Tenant Data Isolation
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Logical database partitioning ensures no merchant ever accesses another company’s order or catalog data.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E0D2]/60 dark:border-white/[0.06] bg-[#FAF8F5] dark:bg-[#0A0E1A] p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                AES-256 & TLS 1.3
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Production database volumes, tokens, and browser communications are encrypted in transit and at rest.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E0D2]/60 dark:border-white/[0.06] bg-[#FAF8F5] dark:bg-[#0A0E1A] p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
                <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                99.99% Cloud Reliability
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Redundant infrastructure ensures your packing stations stay active even during high-traffic Big Billion Day / Great Indian Festival sales.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E0D2]/60 dark:border-white/[0.06] bg-[#FAF8F5] dark:bg-[#0A0E1A] p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
                Role-Based Access (RBAC)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Separate access tiers for Super Admins, Floor Operators, Inventory Managers, and Finance Accountants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. True Company & Verified Contact Information Section */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#C89B3C]/35 bg-gradient-to-br from-[#FFF9EC] via-white to-[#F6EEDC] dark:from-[#0F1626] dark:via-[#0A0E1A] dark:to-[#080B11] p-6 sm:p-10 lg:p-12 shadow-sm dark:shadow-2xl transition-colors">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
              Corporate & Support Information
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
              Direct Contact & Corporate Identity
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              OrderOS is developed and operated directly by our registered team. Reach out for technical onboarding, enterprise plans, or warehouse consulting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Registered Entity */}
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-3">
                  <Building2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
                </div>
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">Registered Legal Entity</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Chakudee Fashion Pvt Ltd</p>
                <p className="text-xs text-slate-500 mt-1">Platform: Chakudee OrderOS</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05] text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Active Enterprise SaaS
              </div>
            </div>

            {/* Corporate Address */}
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-3">
                  <MapPin className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
                </div>
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">Corporate Office</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Surat, Gujarat, India</p>
                <p className="text-xs text-slate-500 mt-1">PIN: 395002 (Textile Commerce Hub)</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05] text-[11px] font-mono text-slate-600 dark:text-slate-400">
                On-Site Fulfillment Labs
              </div>
            </div>

            {/* Direct Email & Support */}
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-5 flex flex-col justify-between shadow-xs md:col-span-2 lg:col-span-1">
              <div>
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center mb-3">
                  <Mail className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
                </div>
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">Direct Compliance & Support</h4>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors break-all block mt-1"
                >
                  {contactEmail}
                </a>
                <p className="text-xs text-slate-500 mt-1">Mon–Sat: 9:00 AM – 7:00 PM IST</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05] text-[11px] font-mono text-[#B88728] dark:text-[#E8C170] font-bold">
                Guaranteed Response &lt; 24h
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#E8C170] hover:bg-[#d8b05c] active:bg-[#c9a14d] text-[#080B11] px-7 sm:px-8 py-3 text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 glow-gold"
            >
              Contact Support Team
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-white px-7 sm:px-8 py-3 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs"
            >
              Register Free Merchant Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
