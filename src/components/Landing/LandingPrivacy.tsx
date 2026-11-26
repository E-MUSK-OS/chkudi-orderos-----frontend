"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  UserCheck,
  Video,
  FileText,
  Trash2,
  Building2,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function LandingPrivacy() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@netu.com";

  const sections = [
    {
      id: "info-we-collect",
      icon: Database,
      num: "1",
      title: "Information We Collect",
      summary:
        "We collect business details, marketplace tokens, order shipping PII, inventory records, and hardware telemetry strictly necessary to deliver the OrderOS commerce terminal.",
      bullets: [
        "Account & Identity Data: Registered business name, GSTIN, PAN, registered office/warehouse address, business email, and authorized admin/staff phone numbers.",
        "Marketplace API Credentials: OAuth access tokens, developer secrets, and refresh keys for Amazon SP-API, Myntra Omnichannel, Flipkart, Meesho, and custom webstores (Shopify/WooCommerce). We never store your root seller marketplace account passwords.",
        "Customer Order Shipping PII: Buyer recipient name, shipping address, delivery pin code, contact phone number (where provided by the marketplace for delivery), package dimensions, and courier AWB tracking IDs.",
        "Warehouse & Inventory Data: Variant catalog SKUs, barcode/QR mappings, rack and bin addressing, raw materials, supplier purchase receipts, and stock count journals.",
        "Video Verification Data (VMS): Packaging workstation video recordings and parcel barcode verification timestamps captured to prevent courier weight disputes and fraudulent returns.",
        "Hardware & System Telemetry: Browser type, operating system, device IP, and session verification tokens.",
      ],
    },
    {
      id: "how-we-use",
      icon: Layers,
      num: "2",
      title: "How We Use Your Information",
      summary: "We use the information strictly to power your multi-channel operations, order fulfillment, and tax compliance.",
      bullets: [
        "Multi-Channel Sync: Synchronize live catalog inventory and route incoming orders across Amazon, Myntra, Flipkart, Meesho, and custom webstores.",
        "Automated Fulfillment: Generate thermal shipping labels, courier manifests, picklists, and packlists through integrated carrier APIs.",
        "Commercial Accounting: Calculate CGST, SGST, IGST taxes and generate statutory sales tax invoices, delivery challans, and party ledgers.",
        "Dispute Defense (VMS): Match packing workstation video recordings with order AWBs to defend against wrongful customer returns and courier weight disputes.",
        "Security & Integrity: Authenticate active sessions via Edge Middleware, enforce role permissions, and prevent unauthorized account access.",
      ],
    },
    {
      id: "how-we-protect",
      icon: Lock,
      num: "3",
      title: "How We Protect Your Information",
      summary: "Enterprise-grade encryption and access controls safeguard your data across all storage and network layers.",
      bullets: [
        "Data in Transit: All communications between browsers, mobile devices, client terminals, and backend servers are encrypted using modern Transport Layer Security (TLS 1.2 and TLS 1.3).",
        "Data at Rest: Production database volumes, persistent storage, Redis operational caches, and automated backups are encrypted using AES-256 standard encryption.",
        "Password Security: User passwords are cryptographically salted and hashed using bcrypt (cost factor 12+). Plaintext credentials are never saved or visible.",
        "Edge Middleware Route Guarding: Next.js Edge Middleware and dynamic client action shields inspect all requests to prevent unauthorized access.",
      ],
    },
    {
      id: "multi-tenant-isolation",
      icon: ShieldCheck,
      num: "4",
      title: "Multi-Tenant Data Isolation & Confidentiality",
      summary: "Strict logical database partitioning guarantees that your business records are never exposed to or pooled with other merchants.",
      bullets: [
        "Logical Separation: Every merchant operates within an isolated tenant workspace. Database queries are partitioned to restrict data access strictly to your authenticated organization.",
        "Proprietary Protection: Your variant cost pricing, supplier identities, margins, warehouse rack addresses, and sales numbers are never shared or visible to competitors.",
        "Zero Competitor Benchmarking: We do not aggregate your sales volume or sales velocity for third-party market intelligence or competitor insights.",
      ],
    },
    {
      id: "pii-compliance",
      icon: EyeOff,
      num: "5",
      title: "Customer PII & Marketplace DPP Compliance (Amazon SP-API)",
      summary:
        "Full compliance with the Amazon Marketplace Developer Data Protection Policy (DPP) and Acceptable Use Policy (AUP) for buyer privacy.",
      bullets: [
        "Legitimate Purpose Only: Buyer names, shipping addresses, and phone numbers are processed solely for order packing, label generation, and statutory GST invoicing.",
        "Zero Commercialization: Buyer personal information is never harvested, resold, leased, or utilized for off-platform advertising or behavioral marketing.",
        "Automated 30-Day Purging: In strict adherence to Amazon SP-API and marketplace DPP guidelines, buyer PII is automatically anonymized or purged within 30 days post-dispatch.",
        "Operator Masking: Packing operators only see the minimal address details necessary to verify packaging and affix shipping labels.",
      ],
    },
    {
      id: "rbac-access",
      num: "6",
      icon: UserCheck,
      title: "Role-Based Access Control (RBAC) & 38 Security Shields",
      summary:
        "Granular permission controls ensure warehouse operators, packing staff, accountants, and administrators only access permitted screens.",
      bullets: [
        "38 Granular Route Rights: Fine-grained permissions divided across Super Admin, Admin, Operator, Inventory Manager, and Accountant roles.",
        "Workspace-Level Configuration: Tenant administrators can enable or disable entire subsystems (such as VMS, offline sales challans, or purchase modules).",
        "Dynamic Action Shields: Both UI controls and backend API endpoints enforce shields that validate whether an active session holds explicit CREATE, UPDATE, or DELETE rights.",
      ],
    },
    {
      id: "vms-video-monitoring",
      num: "7",
      icon: Video,
      title: "Video Monitoring System (VMS) & Dispatch Verification",
      summary:
        "High-definition dispatch video recording and barcode verification media are captured solely for fraud prevention and carrier claim resolution.",
      bullets: [
        "Workstation Camera Pairing: The VMS module pairs packing cameras with barcode scanners to record video clips verifying that the correct items were placed inside the parcel.",
        "Courier Dispute Evidence: Video clips serve as verifiable proof of dispatch to defend merchants against courier weight discrepancies, missing item claims, and wrongful returns.",
        "Restricted Cloud Storage: Video footage is stored in private cloud buckets with temporary signed URLs, indexed strictly by order tracking ID, and auto-archived once claim windows elapse.",
      ],
    },
    {
      id: "gst-ledgers",
      num: "8",
      icon: FileText,
      title: "Commercial Accounting, GST Invoices & Ledger Integrity",
      summary:
        "Commercial invoices, party debit/credit ledgers, and financial records comply with Indian tax regulations and maintain tamper-evident logs.",
      bullets: [
        "Statutory GST Invoicing: OrderOS generates legally binding GST sales invoices, credit notes, sales challans, purchase invoices, and vendor party debit/credit statements.",
        "Statutory Accuracy: Preserves tax rates (HSN/SAC), SGST/CGST/IGST calculations, and buyer/seller GSTIN details in compliance with the Indian Goods and Services Tax Act.",
        "Immutable Audit Records: Ledger records are protected against retroactive tampering. Every transaction is stamped with user identity, timestamp, and unique reference IDs.",
      ],
    },
    {
      id: "cookies-storage",
      num: "9",
      icon: Shield,
      title: "Cookies, Local Storage & Session State Policy",
      summary:
        "Strictly necessary first-party authentication cookies and local preferences. Zero third-party advertising trackers or behavioral pixels.",
      bullets: [
        "Authentication Cookies (`accessToken`): Secure, first-party HTTP cookies with `SameSite=Lax` protection are utilized solely by Next.js Edge Middleware to verify active sessions.",
        "Local Storage Usage: The browser's local storage stores non-sensitive UI states, such as active theme mode (`light`/`dark`) and collapsed sidebar preferences.",
        "Zero Third-Party Ad Trackers: OrderOS contains zero behavioral ad tracking cookies, Meta pixels, Google AdSense cookies, or third-party data broker scripts.",
      ],
    },
    {
      id: "sharing-subprocessors",
      num: "10",
      icon: Building2,
      title: "Sharing Your Information (Third-Party Sub-processors)",
      summary:
        "We never sell, trade, or rent your data. Information is shared only with trusted operational infrastructure partners under strict confidentiality agreements.",
      bullets: [
        "Cloud Infrastructure: Enterprise cloud servers (AWS / DigitalOcean / Vercel) with 99.99% uptime SLAs and restricted physical security.",
        "Verification Media Storage: Private Cloudinary and S3 object storage for product photography and VMS dispute-resolution video clips.",
        "Integrated Logistics Partners: Direct API connections with carriers (Delhivery, BlueDart, Smartr, Amazon Shipping, Ekart) for the sole purpose of generating AWBs and tracking status.",
        "Transactional Mail: Enterprise SMTP and Google Workspace relays utilized solely for password resets, OTP verification, and customer inquiry dispatch.",
      ],
    },
    {
      id: "retention-deletion",
      num: "11",
      icon: Trash2,
      title: "Data Retention & Account Deletion Policy",
      summary:
        "Clear retention lifecycles for marketplace PII, financial ledgers, and full data deletion upon account termination.",
      bullets: [
        "Marketplace PII: Customer delivery addresses and phone numbers are purged or anonymized within 30 days post-dispatch.",
        "Statutory Accounting Records: Sales invoices and ledger books are preserved for the statutory 7-year period mandated by Indian tax and commercial corporate laws.",
        "Right to Deletion: Upon formal account termination, tenant user accounts, API connection tokens, and operational databases are permanently purged within 30 days.",
      ],
    },
    {
      id: "dpdp-statutory",
      num: "12",
      icon: Scale,
      title: "Statutory Compliance: DPDP Act 2023 & Information Technology Act",
      summary:
        "Designed to comply with India's Digital Personal Data Protection Act 2023 and the Information Technology Act 2000.",
      bullets: [
        "DPDP Act 2023: OrderOS adheres to the principles of the Digital Personal Data Protection Act, 2023 of India, acting as a secure Data Processor on behalf of merchant Data Fiduciaries.",
        "IT Act 2000 (Section 43A): We implement the Reasonable Security Practices and Procedures required under Section 43A of the Information Technology Act, 2000 and IT Rules, 2011.",
        "Data Ownership: Merchants retain complete legal ownership of their business data and maintain full control over API keys and access privileges.",
      ],
    },
    {
      id: "merchant-rights",
      num: "13",
      icon: CheckCircle2,
      title: "Your Rights & Self-Service Data Controls",
      summary:
        "You have the right to access, update, export, or revoke access to your business information at any time.",
      bullets: [
        "Right to Export: Export your entire catalog, inventory records, sales manifests, purchase invoices, and party ledgers in structured Excel (.xlsx) and PDF formats anytime.",
        "Right to Correction: Update company profiles, warehouse addresses, GST details, employee profiles, and system dropdown masters directly from the dashboard.",
        "Right to Revocation: Instantly disconnect marketplace SP-API channels or rotate API tokens directly from the Settings panel.",
      ],
    },
    {
      id: "incident-notification",
      num: "14",
      icon: AlertTriangle,
      title: "Security Incident Response & 72-Hour Breach Notification",
      summary:
        "Proactive 24/7 security monitoring, automated anomaly detection, and rapid incident disclosure protocols.",
      bullets: [
        "Continuous Monitoring: Automated rate-limiting, brute-force login throttling, and suspicious token usage monitoring.",
        "72-Hour Disclosure: In the unlikely event of a verified security incident affecting your data, OrderOS will notify account administrators in writing within 72 hours.",
        "Actionable Guidance: Breach notifications include root-cause analyses, affected data categories, mitigations deployed, and recommended protective actions.",
      ],
    },
    {
      id: "contact-grievance",
      num: "15",
      icon: Mail,
      title: "Contact Us & Grievance Redressal",
      summary:
        "If you have any questions, compliance requests, or grievance inquiries regarding this Privacy Policy, please reach out to our dedicated team.",
      bullets: [
        "Company Name: NetuFashion Pvt Ltd",
        "Operating Platform: NetuOrderOS (Enterprise Commerce Operating System)",
        "Registered Office: Surat, Gujarat, India (395002)",
        `Compliance & Privacy Contact: ${contactEmail}`,
        "All privacy inquiries and compliance disclosures receive formal response within 7 business days.",
      ],
    },
  ];

  return (
    <section id="privacy" className="scroll-mt-24 py-8 sm:py-12 lg:py-16 max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">

      {/* 1. TOP HERO BANNER */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#C89B3C]/35 bg-gradient-to-r from-[#FFF9EC] via-white to-[#F7F2E7] dark:from-[#0F1626] dark:via-[#0D1424] dark:to-[#080B11] p-6 sm:p-8 md:p-10 mb-8 sm:mb-10 shadow-sm overflow-hidden transition-colors">
        {/* Ambient Top Light Halos */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#E8C170]/15 dark:bg-[#E8C170]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#2D6A8C]/10 dark:bg-[#2D6A8C]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-10">

          {/* Left Side: 3D Shield Icon with Orbital Rings */}
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Outer Orbital Ring */}
            <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-dashed border-[#B88728]/30 dark:border-[#E8C170]/25 animate-spin [animation-duration:25s]" />
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-[#B88728]/20 dark:border-[#E8C170]/15" />

            {/* Main Shield Bubble */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#B88728] via-[#C89B3C] to-[#996C1B] dark:from-[#E8C170] dark:via-[#D4A747] dark:to-[#B88728] shadow-lg flex items-center justify-center text-white dark:text-[#080B11] transform transition-transform hover:scale-105">
              <Shield className="w-10 h-10 sm:w-14 sm:h-14 fill-current opacity-25 absolute" />
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 relative z-10 drop-shadow-sm" />
            </div>
          </div>

          {/* Right Side: Headline and Subtitle */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed">
              Your privacy is important to us. This Privacy Policy explains how NetuOrderOS collects, uses, and protects your information when you use our multi-marketplace operating system.
            </p>
          </div>

        </div>
      </div>

      {/* 2. MAIN CLEAN POLICY CONTENT AREA */}
      <div className="space-y-4 sm:space-y-6">

        {/* Header Row: Last Updated timestamp */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pb-1 px-1">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Policy • Version 3.4</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C170]" />
            <span>Last Updated: November 18, 2026</span>
          </div>
        </div>

        {/* Section Items Grid (Reduced side margins matching Features page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {sections.map((item) => {
            const Icon = item.icon;
            const isContactSection = item.id === "contact-grievance";

            return (
              <article
                key={item.id}
                id={item.id}
                className={`rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#B88728]/40 dark:hover:border-[#E8C170]/30 transition-all flex flex-col justify-between ${isContactSection ? "md:col-span-2" : ""
                  }`}
              >
                <div>
                  {/* Item Header: Icon Badge + Numbered Heading */}
                  <div className="flex items-start sm:items-center gap-3.5 mb-3">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#B88728] dark:text-[#E8C170]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {item.title}
                      </h2>
                    </div>
                  </div>

                  {/* Item Body: Summary Paragraph */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 pl-0 sm:pl-1">
                    {item.summary}
                  </p>

                  {/* Bullets List */}
                  <ul
                    className={`text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-1 sm:pl-2 ${isContactSection
                        ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5"
                        : "space-y-2"
                      }`}
                  >
                    {item.bullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-2 ${isContactSection && idx === item.bullets.length - 1
                            ? "md:col-span-2"
                            : ""
                          }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#B88728] dark:bg-[#E8C170] mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Special Pill Badges for Contact Section */}
                {isContactSection && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center gap-2.5">
                    <a
                      href={`mailto:${contactEmail}`}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C89B3C]/40 bg-[#FFF9EC] dark:bg-[#C89B3C]/10 text-xs font-semibold text-[#B88728] dark:text-[#E8C170] hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {contactEmail}
                    </a>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C170]" />
                      Surat, Gujarat, India (395002)
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Bottom "Your Data, Our Priority" Trust Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#C89B3C]/35 bg-gradient-to-br from-[#FFF9EC] via-white to-[#F7F2E7] dark:from-[#0F1626] dark:via-[#0A0E1A] dark:to-[#080B11] p-6 sm:p-8 text-center shadow-xs transition-colors mt-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/40 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-[#B88728] dark:text-[#E8C170]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Your Data, Our Priority
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            We are committed to absolute tenant isolation, encrypted transmission, and zero unauthorized commercialization of your data.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/terms"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-full bg-[#E8C170] hover:bg-[#d8b05c] text-[#080B11] text-xs font-extrabold transition-all shadow-xs active:scale-95"
            >
              Review Terms & Conditions
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-full border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>

    </section>
  );
}
