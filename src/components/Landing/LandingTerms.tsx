"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  FileCheck2,
  ShoppingCart,
  Scale,
  Gavel,
  Info,
  List,
  Headphones,
  Mail,
  Lock,
  Server,
  Layers,
  Receipt,
  Video,
  Copyright,
  Ban,
  Wallet,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Handshake,
  MapPin,
  ArrowRight,
} from "lucide-react";

export default function LandingTerms() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "2383elonmusk@gmail.com";

  const pillars = [
    {
      icon: FileText,
      label: "Commercial SaaS Contract",
    },
    {
      icon: ShoppingCart,
      label: "Marketplace Fair Terms",
    },
    {
      icon: Scale,
      label: "Statutory GST Aligned",
    },
    {
      icon: Gavel,
      label: "Surat, Gujarat Court",
    },
  ];

  const terms = [
    {
      id: "acceptance-scope",
      icon: FileCheck2,
      title: "Acceptance of Terms & Enterprise Platform Scope",
      summary:
        "By accessing, registering with, or utilizing the Chakudee OrderOS terminal, you enter into a legally binding commercial SaaS agreement with Chakudee Fashion Pvt Ltd.",
      bullets: [
        "These Terms and Conditions (\"Terms\") govern your access to and use of Chakudee OrderOS, including all associated web applications, backend APIs, Video Monitoring Systems (VMS), and multi-channel synchronization services.",
        "Eligibility: To use OrderOS, you must represent a valid business entity (sole proprietorship, partnership, LLP, private limited company, or enterprise corporation) duly registered under the laws of your jurisdiction, possessing lawful authority to conduct commercial trading.",
        "You agree to comply with these Terms and all applicable laws and regulations while using our platform. If you do not agree with these Terms in their entirety, you must immediately discontinue all use and deactivate your workspace.",
      ],
    },
    {
      id: "account-custody",
      icon: Lock,
      title: "Merchant Account Registration & Credential Custody",
      summary:
        "Merchants are strictly responsible for safeguarding their login credentials, API secrets, and all activities conducted by authorized users under their workspace.",
      bullets: [
        "Account Integrity: You agree to provide accurate, up-to-date company information, registered business addresses, GSTIN certificates, and authorized representative contact details upon registration.",
        "Role Delegation: Tenant Super Admins hold sole authority to provision, modify, or revoke user accounts (Admins, Operators, Inventory Managers, Accountants). You are strictly responsible for all actions executed under delegated operator accounts.",
        "Credential Security: You must preserve the strict confidentiality of your access passwords, session cookies, and two-factor OTP tokens. You must notify Chakudee OrderOS immediately upon discovering any unauthorized access, session compromise, or security anomaly.",
      ],
    },
    {
      id: "marketplace-integrations",
      icon: Server,
      title: "Multi-Marketplace API Integrations (Amazon, Myntra, Flipkart, Meesho, Webstores)",
      summary:
        "Merchants must maintain valid seller standing on integrated channels; OrderOS is not liable for third-party marketplace policy penalties, seller bans, or channel API outages.",
      bullets: [
        "Channel Authorization: By connecting Amazon SP-API, Myntra Omnichannel, Flipkart, Meesho, or custom webstores (Shopify/WooCommerce), you warrant that you are the lawful owner or authorized operator of the respective merchant accounts.",
        "Compliance with Channel Policies: You must strictly adhere to the third-party developer policies, buyer data agreements, and listing guidelines of each connected marketplace. OrderOS will not be liable if a marketplace suspends your seller account due to late dispatch, stockout cancellations, or listing violations.",
        "API Availability: While OrderOS strives for zero sync latency, we do not control third-party marketplace API uptime, server rate limits, or maintenance throttles imposed by Amazon, Myntra, or other platforms. Service interruptions originating from external marketplace APIs remain outside OrderOS warranty.",
      ],
    },
    {
      id: "warehouse-inventory",
      icon: Layers,
      title: "Warehouse Inventory, Variant Catalog & Stock Allocations",
      summary:
        "OrderOS automates stock synchronization across channels based on your inputs; merchants maintain ultimate responsibility for physical stock reconciliation.",
      bullets: [
        "Catalog Accuracy: You are solely responsible for verifying variant attributes (style codes, size scales, color designations, fabric specifications) and mapping SKUs correctly to marketplace channel listings.",
        "Physical Stock Audits: While OrderOS accurately reserves and deducts stock upon order import and dispatch, merchants must perform routine physical rack/bin inventory reconciliations. OrderOS is not liable for discrepancies caused by manual floor misplacement or unrecorded material movements.",
        "Multi-Channel Overselling: OrderOS synchronizes stock buffers across channels in real-time. In the event of simultaneous lightning flash sales or third-party channel sync delays exceeding normal API latencies, the merchant is responsible for managing backorders or buyer cancellations.",
      ],
    },
    {
      id: "gst-invoicing",
      icon: Receipt,
      title: "Commercial Invoicing, GST Taxes & E-Way Bill Compliance",
      summary:
        "OrderOS provides tax calculation engines and invoice generation tools; merchants remain legally responsible for statutory tax filings and compliance.",
      bullets: [
        "Statutory Responsibility: You bear sole legal liability for ensuring correct tax rates, HSN/SAC codes, state of supply declarations, and GSTIN validations applied to generated sales invoices, credit notes, and sales challans.",
        "E-Way Bills & Logistics Documents: Generation of valid E-Way bills and delivery challans for goods transit must comply with the Central Goods and Services Tax (CGST) Act, 2017. OrderOS provides the document template, but the underlying transaction legality is strictly the merchant's obligation.",
        "Audit Trail: OrderOS maintains timestamped commercial records to assist with financial audits. However, the software does not substitute for certified professional chartered accountancy or formal statutory audit services.",
      ],
    },
    {
      id: "vms-dispatch-video",
      icon: Video,
      title: "Video Monitoring System (VMS) & Dispatch Verification Terms",
      summary:
        "Workstation packing recordings are provided for parcel dispute evidence; merchants must ensure appropriate staff consent and operational camera alignment.",
      bullets: [
        "Workstation Recording: The OrderOS VMS module captures dispatch packing videos to record barcode scans, item inspections, and parcel sealing for courier claim defense.",
        "Operator Consent: You warrant that warehouse packing personnel operating under VMS-equipped packing tables have been duly notified and provided lawful consent for workstation video recording during packing shifts, in compliance with applicable employment and privacy laws.",
        "Storage & Archival: Video recordings are hosted in secure cloud object storage for dispute resolution windows. Merchants are responsible for exporting or archiving clips required for long-term carrier disputes prior to automated lifecycle purging.",
      ],
    },
    {
      id: "intellectual-property",
      icon: Copyright,
      title: "Intellectual Property Rights & Merchant Data Ownership",
      summary:
        "Chakudee Fashion Pvt Ltd owns all rights to the OrderOS software; merchants retain 100% proprietary ownership of their business data.",
      bullets: [
        "OrderOS IP: All software code, user interface designs, algorithmic workflows, database schemas, trademarks, brand logos, and platform documentation are the exclusive intellectual property of Chakudee Fashion Pvt Ltd.",
        "Merchant Data Ownership: You retain complete, unrestricted ownership of your uploaded product imagery, catalog titles, pricing margins, vendor identities, customer records, and financial books. OrderOS claims no intellectual property rights over your proprietary merchant assets.",
        "Feedback & Suggestions: Any voluntary feature recommendations, workflow ideas, or bug reports submitted by merchants may be integrated into OrderOS platform upgrades without obligation of royalty or compensation.",
      ],
    },
    {
      id: "acceptable-use",
      icon: Ban,
      title: "Acceptable Use Policy (AUP) & Prohibited Conduct",
      summary:
        "Strict prohibition of counterfeit merchandise, fraudulent orders, malicious scanning, penetration probing, or abusive automation.",
      bullets: [
        "Lawful Goods Only: You may not use OrderOS to catalog, fulfill, or process orders for counterfeit products, stolen goods, contraband, hazardous materials, or merchandise that infringes upon third-party trademark or patent rights.",
        "System Abuse: You agree not to perform automated DDoS attacks, unauthorized vulnerability scanning, endpoint crawling, or SQL injection testing against OrderOS servers. Such actions result in immediate workspace termination and criminal disclosure under the IT Act, 2000.",
        "Security Shield Integrity: Attempting to bypass route guards, client configuration action shields, or tampering with session cookies will trigger immediate administrative account lockouts.",
      ],
    },
    {
      id: "fees-billing",
      icon: Wallet,
      title: "Subscription Fees, Wallet Transactions & Payment Terms",
      summary:
        "Clear billing cycles, wallet transaction policies, applicable GST taxes, and workspace restrictions for overdue accounts.",
      bullets: [
        "SaaS Fees: Access to OrderOS modules is subject to agreed subscription fees, order processing volume tiers, or wallet pre-paid balances as detailed in your workspace commercial agreement.",
        "Taxes: All stated SaaS fees are exclusive of applicable Indian Goods and Services Tax (GST 18%), which will be charged and reflected on official monthly B2B tax invoices.",
        "Wallet Balance: Where pre-paid wallet debiting is enabled for shipping labels or API dispatches, merchants must maintain a positive balance. Negative balances may temporarily restrict automatic label generation until balance replenishment.",
      ],
    },
    {
      id: "account-locking",
      icon: ShieldAlert,
      title: "Account Locking, Workspace Suspension & Administrative Holds",
      summary:
        "OrderOS reserves the right to lock or suspend workspaces for non-payment, verified security breaches, or statutory compliance violations.",
      bullets: [
        "Suspension Grounds: OrderOS administrators reserve the right to temporarily lock or restrict a tenant workspace in the event of:",
        "(a) Prolonged subscription non-payment or billing default.",
        "(b) Verified security credential leak or unauthorized session use.",
        "(c) Fraudulent order, inventory, or dispatch activity.",
        "(d) Formal judicial, statutory, or regulatory notice.",
        "Lock Notifications: Whenever an account lock is initiated, an automated security notification is delivered to the primary account administrator detailing the hold reason and required remediation steps.",
        "Remediation & Reactivation: Workspaces will be promptly restored once outstanding billing defaults are cleared or security investigations conclude satisfactorily.",
      ],
    },
    {
      id: "uptime-sla",
      icon: Clock,
      title: "Service Availability & Downtime Disclaimers",
      summary:
        "Targeting 99.9% platform availability for uninterrupted order processing and multi-channel synchronization.",
      bullets: [
        "Availability Target: OrderOS strives to maintain 99.9% system availability across core order processing, inventory sync, and dispatch scanning infrastructure.",
        "Force Majeure: OrderOS is not liable for performance failures resulting from national telecommunication outages, undersea fiber cuts, cloud host region downtime (AWS/Vercel), acts of war, or severe natural disasters beyond reasonable commercial control.",
      ],
    },
    {
      id: "disclaimer-warranties",
      icon: AlertTriangle,
      title: "Disclaimer of Warranties ('As-Is' & 'As-Available')",
      summary:
        "OrderOS provides enterprise-grade commerce tooling on an 'As-Is' basis without implied warranties of merchantability or uninterrupted perfection.",
      bullets: [
        "Except as explicitly set forth herein, OrderOS is provided on an 'As-Is' and 'As-Available' operational basis. Chakudee Fashion Pvt Ltd disclaims all express or implied warranties, including merchantability, title, and fitness for a particular business purpose.",
        "We do not guarantee that your use of OrderOS will ensure specific marketplace sales volumes, eliminate all human warehouse errors, or guarantee third-party courier delivery timeliness.",
      ],
    },
    {
      id: "limitation-liability",
      icon: Scale,
      title: "Limitation of Commercial Liability",
      summary:
        "Aggregate liability is strictly capped at subscription fees paid in the preceding 12 months; no liability for indirect or consequential losses.",
      bullets: [
        "To the maximum extent permitted by applicable Indian law, in no event shall Chakudee Fashion Pvt Ltd, its directors, officers, employees, or affiliates be liable for indirect, incidental, punitive, or consequential damages (including lost profits, goodwill, or business interruption).",
        "Aggregate Cap: The total cumulative liability of Chakudee Fashion Pvt Ltd for all claims arising out of or related to these Terms or platform usage shall be strictly capped at the total SaaS subscription fees actually paid by the merchant to OrderOS in the twelve (12) months preceding the incident.",
      ],
    },
    {
      id: "indemnification",
      icon: Handshake,
      title: "Merchant Indemnification Obligations",
      summary:
        "Merchants agree to indemnify OrderOS against third-party claims arising from merchant goods, tax disputes, or marketplace policy breaches.",
      bullets: [
        "You agree to defend, indemnify, and hold harmless Chakudee Fashion Pvt Ltd, its directors, and staff against any third-party claims, liabilities, damages, and legal expenses arising out of:",
        "(a) Your breach of these Terms or platform operational policies.",
        "(b) Intellectual property or trademark infringement related to products you sell.",
        "(c) Inaccurate GST invoicing, faulty tax calculations, or tax evasion claims.",
        "(d) Violation of marketplace seller agreements on Amazon, Myntra, Flipkart, or Meesho.",
      ],
    },
    {
      id: "governing-law",
      icon: MapPin,
      title: "Governing Law, Dispute Resolution & Exclusive Jurisdiction",
      summary:
        "Governed exclusively by the laws of India, with exclusive legal jurisdiction vested in the competent courts of Surat, Gujarat.",
      bullets: [
        "Governing Law: These Terms and any dispute arising from your relationship with Chakudee OrderOS shall be interpreted and governed in accordance with the substantive laws of the Republic of India.",
        "Amicable Resolution: Prior to formal litigation, the parties agree to seek resolution through commercial good-faith consultation for a period of not less than thirty (30) days from written notice.",
        "Exclusive Jurisdiction: In the event of litigation or formal arbitration, the parties unconditionally submit to the exclusive territorial jurisdiction of the competent civil courts situated in Surat, Gujarat, India.",
        "Official Legal Entity: Chakudee Fashion Pvt Ltd, Surat, Gujarat, India (395002).",
      ],
    },
  ];

  const [activeId, setActiveId] = useState<string>("acceptance-scope");
  const isClickScrollingRef = React.useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrollingRef.current) return;

      const targetThreshold = 180;
      let currentActive = terms[0].id;

      for (let i = terms.length - 1; i >= 0; i--) {
        const el = document.getElementById(terms[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= targetThreshold) {
            currentActive = terms[i].id;
            break;
          }
        }
      }

      setActiveId(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveId(id);
    isClickScrollingRef.current = true;

    const element = document.getElementById(id);
    if (element) {
      const yOffset = -105;
      const rect = element.getBoundingClientRect();
      const currentScroll =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const targetY = rect.top + currentScroll + yOffset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    }

    setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 800);
  };

  return (
    <section id="terms" className="scroll-mt-24 py-8 sm:py-12 lg:py-16 max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
      
      {/* 1. Header Hero Title (Matches Mockup) */}
      <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 px-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C89B3C]/40 bg-[#FFF9EC] dark:bg-[#C89B3C]/10 text-[#B88728] dark:text-[#E8C170] text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[1.5px] mb-3 shadow-xs">
          <FileText className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C170]" />
          Commercial Enterprise SaaS Agreement
        </div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          Terms & Conditions of Service
        </h1>
        <p className="mt-3 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          The legal and operational terms governing your commercial deployment of Chakudee OrderOS, multi-marketplace sync, warehouse inventory, VMS video proof, and GST accounting.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>Effective: November 2026</span>
          <span>•</span>
          <span>Version 3.4 Enterprise</span>
          <span>•</span>
          <span>Chakudee Fashion Pvt Ltd</span>
        </div>
      </div>

      {/* 2. Key Pillars 4-Cards Row (Matches Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {pillars.map((pillar, idx) => {
          const PillarIcon = pillar.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 flex items-center gap-3 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/30 transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#C89B3C]/10 border border-[#C89B3C]/30 flex items-center justify-center shrink-0">
                <PillarIcon className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {pillar.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Main Split Section: Left Terms List (8 cols) + Right Sticky Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8 sm:mb-10">
        
        {/* Left Side: Detailed Terms Cards */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {terms.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                id={item.id}
                className="scroll-mt-28 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/30 transition-all"
              >
                {/* Card Title with Icon */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#C89B3C]/10 border border-[#C89B3C]/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#B88728] dark:text-[#E8C170]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h2>
                </div>

                {/* Callout Summary Box with Info Icon (Matches Mockup) */}
                <div className="rounded-xl border border-[#C89B3C]/25 bg-[#FFF9EC]/90 dark:bg-[#C89B3C]/10 p-3 sm:p-3.5 flex items-start gap-2.5 mb-3.5 text-xs sm:text-sm font-semibold text-[#8B6514] dark:text-[#E8C170] leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B88728] dark:text-[#E8C170]" />
                  <span>{item.summary}</span>
                </div>

                {/* Detailed Bullet Points */}
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-1">
                  {item.bullets.map((bullet, idx) => {
                    const match = bullet.match(/^(\([a-d]\))(.*)$/i);
                    if (match) {
                      return (
                        <li key={idx} className="flex items-start gap-2.5 ml-3 sm:ml-5 text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/40 text-[11px] font-bold text-[#B88728] dark:text-[#E8C170] shrink-0 mt-0.5">
                            {match[1].replace(/[()]/g, "")}
                          </span>
                          <span className="pt-0.5">{match[2].trim()}</span>
                        </li>
                      );
                    }

                    return (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#B88728] dark:bg-[#E8C170] mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>

        {/* Right Side: Sticky Table of Contents & Legal Assistance Cards (Matches Mockup) */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
          
          {/* Card 1: Table of Contents (Navy Header + Numbered List) */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-xs transition-colors">
            
            {/* Dark Blue Header Banner */}
            <div className="bg-[#151D30] dark:bg-[#0A0E1A] text-white px-4 py-3 flex items-center gap-2.5">
              <List className="w-4 h-4 text-[#E8C170]" />
              <span className="text-xs sm:text-sm font-bold tracking-wide">
                Table of Contents
              </span>
            </div>

            {/* Numbered Jump Links (No inner scrollbar, fits cleanly) */}
            <div className="p-2 sm:p-2.5 space-y-0.5">
              {terms.map((item, idx) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#EEF2F6] dark:bg-white/10 text-[#B88728] dark:text-[#E8C170] font-bold shadow-xs"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:text-[#B88728] dark:hover:text-[#E8C170] font-medium"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "border-[#B88728] dark:border-[#E8C170] text-[#B88728] dark:text-[#E8C170] bg-[#FFF9EC] dark:bg-[#E8C170]/15"
                          : "border-[#C89B3C]/40 text-[#B88728] dark:text-[#E8C170] bg-transparent"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="leading-snug line-clamp-1">
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Card 2: Need legal assistance? Card (Matches Mockup) */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 text-center shadow-xs transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/40 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Need legal assistance?
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Our legal team is here to help you with any questions.
                </p>
              </div>
            </div>
            <a
              href={`mailto:${contactEmail}?subject=OrderOS%20Terms%20and%20Legal%20Inquiry`}
              className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#E8C170] hover:bg-[#d8b05c] text-[#080B11] text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              Contact Legal Team
            </a>
          </div>

        </aside>

      </div>

      {/* 4. Full-Width Bottom Card: Commercial or Contractual Questions? (Matches Mockup) */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#C89B3C]/35 bg-[#FFF9EC]/80 dark:bg-[#0F1626] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs mb-8">
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <div className="h-10 w-10 rounded-xl bg-[#FFF9EC] dark:bg-[#C89B3C]/10 border border-[#C89B3C]/30 flex items-center justify-center shrink-0 hidden sm:flex">
            <Scale className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Commercial or Contractual Questions?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              For enterprise licensing inquiries, custom SLA agreements, or official legal notices, please reach out directly to our corporate legal team.
            </p>
          </div>
        </div>

        <a
          href={`mailto:${contactEmail}?subject=OrderOS%20Commercial%20Inquiry`}
          className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-[#E8C170] hover:bg-[#d8b05c] text-[#080B11] text-xs font-bold shadow-xs whitespace-nowrap shrink-0 transition-all active:scale-95"
        >
          <Mail className="w-3.5 h-3.5" />
          Contact Legal: {contactEmail}
        </a>
      </div>

    </section>
  );
}
