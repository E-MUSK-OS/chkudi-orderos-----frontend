"use client";

import React from "react";
import {
  Video,
  ShoppingBag,
  Boxes,
  FileText,
  Truck,
  BookOpen,
  Printer,
  BarChart3,
  Globe,
  Check,
} from "lucide-react";

export default function LandingFeatures() {
  const softwareFeatures = [
    {
      icon: Video,
      badge: "VMS Dispatches & Scans",
      title: "Video Monitoring System (VMS)",
      description:
        "High-definition packing workstation video recording paired automatically with parcel AWB tracking numbers. Capture indisputable packing proof to overturn courier weight discrepancies, buyer fraud, and transit dispute claims.",
      capabilities: [
        "Workstation Live Video & TrackingID Scans",
        "AWB-Linked Packaging Clip Archival",
        "Courier Return & Weight Dispute Protection",
      ],
      footerTag: "Module: VMS Operator & Admin",
    },
    {
      icon: ShoppingBag,
      badge: "Amazon SP-API & Myntra",
      title: "Multi-Marketplace Order Processing",
      description:
        "Unified fulfillment terminal for marketplace orders. Scan Amazon AWBs with real-time discrepancy checking, manage Myntra Tag Loop verifications, generate batch picklists, and auto-format compliant marketplace tax invoices.",
      capabilities: [
        "Amazon AWB Barcode Scan & Result Diff",
        "Myntra Tag Loop & Picklist Generation",
        "Automated Tax Invoice Formatter Engine",
      ],
      footerTag: "Module: Order Process Hub",
    },
    {
      icon: Boxes,
      badge: "Variant Catalog & Rack Mapping",
      title: "Products & Variant Inventory",
      description:
        "Comprehensive variant catalog supporting apparel style codes, colorways, size scales, and fabrics. Map physical warehouse rack and bin coordinates (e.g., Rack A-04, Bin C-12) to keep live multi-channel stock synchronized.",
      capabilities: [
        "Real-Time Multi-Channel Stock Deductions",
        "Hierarchical Variant Matrix (Style/Color/Size)",
        "Physical Rack & Bin Location Allocation",
      ],
      footerTag: "Module: Products & Inventory",
    },
    {
      icon: FileText,
      badge: "B2B & Institutional Sales",
      title: "Sales & GST Invoicing",
      description:
        "Handle direct wholesale, showroom sales, and institutional purchase orders (PO). Instantly generate Goods Transit Delivery Challans, statutory GST tax invoices (CGST, SGST, IGST), and maintain compliance with commercial tax laws.",
      capabilities: [
        "PO-Based Sales Upload & Reconciliation",
        "Official Delivery & Transit Sales Challans",
        "GST-Compliant B2B & B2C Invoicing",
      ],
      footerTag: "Module: Transactions / Sales",
    },
    {
      icon: Truck,
      badge: "Stock Inward & Suppliers",
      title: "Purchase & Finished Goods",
      description:
        "Streamline raw material and finished garment inward receipts from factories and jobbers. Create finished goods inward challans, log vendor purchase invoices, and automatically update warehouse stock journals.",
      capabilities: [
        "Finished Goods Inward Challan Slips",
        "Supplier Purchase Bill Reconciliation",
        "Raw Material & Fabric Stock Journals",
      ],
      footerTag: "Module: Transactions / Purchase",
    },
    {
      icon: BookOpen,
      badge: "Double-Entry Accounting",
      title: "Company Ledgers & Payroll",
      description:
        "Built-in commercial accounting and human resource management directly inside your terminal. Maintain complete customer and vendor debit/credit ledger books, manage employee master profiles, and track salaried attendance.",
      capabilities: [
        "Customer & Vendor Debit/Credit Ledgers",
        "Employee Profiles & Access Hierarchy",
        "Salaried Employee Attendance & Wage Records",
      ],
      footerTag: "Module: Company Settings & Ledger",
    },
    {
      icon: Printer,
      badge: "PrintBridge Local Service",
      title: "Thermal Barcodes & Label Print",
      description:
        "Direct desktop hardware integration via PrintBridge running on localhost:17890. Print shipping labels and SKU barcode stickers directly to thermal printers (TSC, Zebra, TVS) without tedious browser print dialog popups.",
      capabilities: [
        "Custom Thermal Label Layout Configuration",
        "Zero-Click Direct Thermal Label Printing",
        "High-Speed SKU Barcode & QR Label Generation",
      ],
      footerTag: "Module: Barcode & PrintBridge",
    },
    {
      icon: BarChart3,
      badge: "Channel Performance Stats",
      title: "Products Analytics & Velocity",
      description:
        "Deep performance analytics tracking SKU sales velocity, return rates, and dispatch throughput across Amazon and connected marketplaces. Identify fast-moving garments and dead inventory before replenishing stocks.",
      capabilities: [
        "Amazon SP-API Sales & Product Analytics",
        "Order Fulfillment Health & Velocity Rates",
        "Inventory Turnover & Dead-Stock Forecasts",
      ],
      footerTag: "Module: Products Analytics",
    },
    {
      icon: Globe,
      badge: "Channel Sync & Excel Tools",
      title: "Webstore & Multi-Store SKU Mapping",
      description:
        "Bridge marketplace listing SKUs to internal master variant codes across Amazon, Flipkart, Meesho, and private webstores. Includes bulk Excel data import/export engines to upload catalogs and adjust prices in bulk.",
      capabilities: [
        "Cross-Platform Sub-SKU Mapping Engine",
        "Webstore Sync & 1-Click Channel Toggles",
        "Bulk Excel Catalog Import & Setting Masters",
      ],
      footerTag: "Module: Settings & Webstore",
    },
  ];

  return (
    <section id="features" className="scroll-mt-24 py-12 sm:py-20 max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
      {/* Section Eyebrow & Title (Centered) */}
      <div className="max-w-4xl mx-auto mb-10 sm:mb-16 px-2 text-center">
        <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
          Built-in Software Modules
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mt-2 text-slate-900 dark:text-white leading-[1.15] tracking-tight">
          Everything your warehouse needs,<br />
          <span className="font-serif italic font-normal text-[#B88728] dark:text-[#E8C170]">
            in one integrated operating system.
          </span>
        </h2>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Engineered to replace fragmented seller portals and manual spreadsheets. Explore the full suite of operational modules built directly into the NetuOrderOS terminal.
        </p>
      </div>

      {/* 9 Feature Cards Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {softwareFeatures.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 lg:p-7 flex flex-col justify-between hover:border-[#B88728]/50 dark:hover:border-[#E8C170]/40 transition-all shadow-xs group"
            >
              <div>
                {/* Header Icon + Module Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C170] px-2.5 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/20">
                    {item.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Key Capabilities Checklist */}
                <ul className="space-y-2 mb-4 pt-2 border-t border-slate-100 dark:border-white/[0.05]">
                  {item.capabilities.map((cap, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Tag */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>{item.footerTag}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Active</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
