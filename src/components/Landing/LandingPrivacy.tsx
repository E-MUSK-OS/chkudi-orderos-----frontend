"use client";

import React from "react";

export default function LandingPrivacy() {
  return (
    <section id="privacy" className="scroll-mt-24 py-12 sm:py-20 border-t border-[#E7E0D2] dark:border-white/[0.08] max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 px-2">
        <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
          Trust & Compliance
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
          Privacy Policy & Security Standard
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
          Your merchant data, marketplace tokens, customer order addresses, and financial ledgers are protected by enterprise isolation.
        </p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-8 lg:p-10 shadow-xs space-y-5 sm:space-y-6">
        
        <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4 sm:pb-5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E8C170] shrink-0" />
            1. Data Isolation & Tenant Confidentiality
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            OrderOS operates strict logical database separation between merchant accounts. Your product catalog, cost pricing, supplier identities, party debit/credit ledger, and sales volume are never aggregated, shared, or accessible to other clients.
          </p>
        </div>

        <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4 sm:pb-5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E8C170] shrink-0" />
            2. Marketplace Token Security & API Authorization
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            All API credentials, refresh tokens, and keys connected to Amazon SP-API, Myntra Omnichannel, and webstore channels are encrypted using AES-256 at rest and transmitted strictly over TLS 1.3 encrypted pipelines. OrderOS never requests or stores your primary marketplace root passwords.
          </p>
        </div>

        <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4 sm:pb-5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E8C170] shrink-0" />
            3. Customer Personal Identifiable Information (PII) Protection
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Shipping labels and order addresses are handled strictly for fulfillment verification and statutory GST sales invoicing. OrderOS complies with marketplace PII data retention standards: buyer information is purged or anonymized according to statutory marketplace retention policies.
          </p>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E8C170] shrink-0" />
            4. Role-Based Access Control (RBAC) & Audit Logging
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The software enforces 38 granular route permissions. Warehouse operators, packing staff, accountants, and administrators only access the specific screens granted by your central client configuration. Every stock adjustment, invoice generation, and ledger entry maintains an immutable timestamped audit log.
          </p>
        </div>

      </div>
    </section>
  );
}
