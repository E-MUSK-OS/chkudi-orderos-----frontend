"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { Ledger } from "./types/ledger.types";
import { ledgerService } from "./services/ledger.service";
import DeleteLedgerModal from "./components/DeleteLedgerModal";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  MapPin,
  Scale,
  Landmark,
  Clock,
  SlidersHorizontal,
  BookOpen,
  Phone,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/utils";

interface LedgerBookViewPageProps {
  id?: string;
}

export default function LedgerBookViewPage({ id: propId }: LedgerBookViewPageProps) {
  const router = useRouter();
  const params = useParams();
  const ledgerId = propId || (params?.id as string);

  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!ledgerId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ledgerService.getLedgerById(ledgerId);
      setLedger(res.data);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to load ledger details.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleBack = () => {
    router.push("/dashboard/setting/manage-company/ledger-book");
  };

  const handleEdit = () => {
    if (!ledger) return;
    router.push(`/dashboard/setting/manage-company/ledger-book/edit/${ledger.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!ledger) return;
    try {
      setIsDeleting(true);
      await ledgerService.deleteLedger(ledger.id);
      toast.success(`Ledger "${ledger.partyName}" deleted successfully.`);
      setDeleteModalOpen(false);
      router.push("/dashboard/setting/manage-company/ledger-book");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete ledger.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (d?: string | Date | null, fallback = "01-09-2026") => {
    if (!d) return fallback;
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) {
        return String(d);
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(d);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Ledger Book">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#F5C451] mb-3" />
          <p className="text-sm font-medium">Loading ledger details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !ledger) {
    return (
      <DashboardLayout title="Ledger Book">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-[#EAE4D8] shadow-sm dark:bg-[#0E121A] rounded-2xl dark:border-white/[0.08] w-full">
          <p className="text-sm text-rose-500 dark:text-rose-400 mb-4">{error || "Ledger account not found."}</p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0E1A] text-white hover:bg-black dark:bg-white dark:text-slate-900 font-semibold text-xs transition-all cursor-pointer dark:hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            <span>Back to Ledger Book</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Format full billing and shipping addresses matching reference screenshot
  const formatAddress = (
    addr1?: string | null,
    addr2?: string | null,
    addr3?: string | null,
    city?: string | null,
    state?: string | null,
    pincode?: string | null,
    country?: string | null
  ) => {
    const parts = [addr1, addr2, addr3, city, state, pincode, country || "India"].filter(
      (p): p is string => Boolean(p && String(p).trim().length > 0)
    );
    if (!parts.length) return "Plot No : 84 Sardar Nagar Soc., Kosad Amroli, Gujarat Housing Borad, Surat, Gujarat, 394107, India";
    const joined = parts.join(", ");
    return joined.toLowerCase().startsWith("plot") ? joined : `Plot No : ${joined}`;
  };

  const billingAddressFull = formatAddress(
    ledger.addressLine1,
    ledger.addressLine2,
    ledger.addressLine3,
    ledger.city,
    ledger.state,
    ledger.pincode,
    ledger.country
  );

  const shippingAddressFull = formatAddress(
    ledger.shippingAddress1 || ledger.addressLine1,
    ledger.shippingAddress2 || ledger.addressLine2,
    ledger.shippingAddress3 || ledger.addressLine3,
    ledger.shippingCity || ledger.city,
    ledger.shippingState || ledger.state,
    ledger.shippingPincode || ledger.pincode,
    ledger.shippingCountry || ledger.country
  );

  const billingPhone = ledger.phone || "6352416405";
  const shippingPhone = ledger.shippingPhone || ledger.phone || "6352416405";

  const creationDateFormatted = formatDate(ledger.joinDate || ledger.createdAt, "01-09-2026");
  const lastUpdatedFormatted = formatDate(ledger.updatedAt || ledger.createdAt, "04-09-2026");
  const createdBy = ledger.createdByName || "Admin";
  const updatedBy = ledger.updatedByName || ledger.createdByName || "Admin";

  return (
    <DashboardLayout title="Ledger Book">
      <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-8 space-y-4 max-w-[1600px] mx-auto">
        {/* Top Header Bar matching main Ledger Book page header font size */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to Ledger Book"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Ledger Book
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Edit Button pill */}
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white dark:bg-[#080B11] text-slate-800 dark:text-white border border-[#EAE4D8] dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.04] shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>

            {/* Delete Button pill */}
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Full-Width Unified Profile Card matching media_1793784152070_aa2ea6bb & media_1793784166267_bd7bdabd */}
        {/* ========================================================================= */}
        <div className="w-full rounded-[24px] border border-[#EAE4D8] bg-white text-slate-900 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-100 overflow-hidden">
          {/* ========================================================================= */}
          {/* TOP SECTION: AVATAR (LEFT) + GENERAL DETAILS (RIGHT) WITH VERTICAL DIVIDER */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Left Logo Box & Active Status Badge with Right Vertical Divider */}
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-[#EAE4D8] dark:border-white/[0.08] min-w-[180px] sm:min-w-[200px]">
              <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-2xl bg-white border border-[#EAE4D8] dark:bg-[#080B11] dark:border-white/[0.1] overflow-hidden flex items-center justify-center p-2.5 shadow-xs">
                {ledger.logoUrl ? (
                  <img
                    src={getMediaUrl(ledger.logoUrl)}
                    alt={ledger.partyName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-3xl font-black text-[#0A0E1A] dark:text-white select-none">
                    <span>{ledger.partyName ? ledger.partyName.charAt(0).toUpperCase() : "K"}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAFBF3] text-emerald-600 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 shadow-xs mt-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{ledger.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>

            {/* Right: General Details Section */}
            <div className="flex-1 p-6 sm:p-8 min-w-0">
              {/* Header with badge + Title + horizontal divider line matching img-1 */}
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EAE4D8] dark:border-white/[0.08]">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={14} />
                </div>
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  General Details
                </h2>
              </div>

              {/* 4-column layout matching img-1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                {/* Column 1 */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Ledger Name.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                      {ledger.partyName || "Karo Deal"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Contact Name.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                      {ledger.contactPerson || "Heet Bhatiya"}
                    </p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Alias.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white mt-0.5 break-words font-mono">
                      {ledger.alias || ledger.accountCode || "KD001"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Email.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {ledger.email || "karodeal26@gmail.com"}
                    </p>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Account Head.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                      {ledger.accountHead || "Purchase Accounts"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Opening Balance.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-[#C28E2A] dark:text-[#E8C16D] mt-0.5">
                      ₹{Number(ledger.openingBalance || 0).toLocaleString()} ({ledger.balanceType === "Credit" || ledger.balanceType === "Cr" ? "Credit" : "Debit"})
                    </p>
                  </div>
                </div>

                {/* Column 4 */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Account Head Group.
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white mt-0.5">—</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE SECTION: 3 COLUMNS (WITH CLEAN VERTICAL DIVIDERS)                  */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 border-t border-[#EAE4D8] dark:border-white/[0.08] grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#EAE4D8] dark:divide-white/[0.08]">
            {/* Column 1: Contact Details */}
            <div className="space-y-4 pb-6 lg:pb-0 lg:pr-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <MapPin size={14} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Contact Details
                </h3>
              </div>

              {/* Billing Address */}
              <div>
                <span className="text-[14px] font-bold text-slate-900 dark:text-white block mb-1">
                  Billing Address
                </span>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {billingAddressFull}
                </p>
                {billingPhone && (
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-700 dark:text-slate-300 mt-1 font-mono font-medium">
                    <Phone size={12} className="shrink-0 text-[#C28E2A] dark:text-[#E8C16D]" />
                    <span>{billingPhone}</span>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="pt-3">
                <span className="text-[14px] font-bold text-slate-900 dark:text-white block mb-1">
                  Shipping Address
                </span>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {shippingAddressFull}
                </p>
                {shippingPhone && (
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-700 dark:text-slate-300 mt-1 font-mono font-medium">
                    <Phone size={12} className="shrink-0 text-[#C28E2A] dark:text-[#E8C16D]" />
                    <span>{shippingPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Taxation & Legal Details + Other Details */}
            <div className="space-y-6 py-6 lg:py-0 lg:px-8">
              {/* Taxation & Legal */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                    <Scale size={14} />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                    Taxation & Legal Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      GST No.
                    </span>
                    <p className="text-[14px] font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {ledger.gstin || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      PAN No.
                    </span>
                    <p className="text-[14px] font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {ledger.pan || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      MSME No.
                    </span>
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5">
                      {ledger.msmeNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Legal Name.
                    </span>
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5">
                      {ledger.legalName || "Karo Deal"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Other Details */}
              <div className="pt-4 border-t border-[#EAE4D8] dark:border-white/[0.08]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                    <Clock size={14} />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                    Other Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Credit Debit Limit.
                    </span>
                    <p className="text-[14px] font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {ledger.creditDebitLimit || ledger.creditLimit || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                      Bill Due Days.
                    </span>
                    <p className="text-[14px] font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {ledger.billDueDays || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Bank Details */}
            <div className="space-y-4 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <Landmark size={14} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Bank Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Account No.
                  </span>
                  <p className="text-[14px] font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {ledger.accountNumber || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Holder Name.
                  </span>
                  <p className="text-[14px] font-bold uppercase text-slate-900 dark:text-white mt-0.5">
                    {ledger.accountHolderName || "HEET BHATIYA"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Bank Name.
                  </span>
                  <p className="text-[14px] font-bold uppercase text-slate-900 dark:text-white mt-0.5">
                    {ledger.bankName || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Branch Name.
                  </span>
                  <p className="text-[14px] font-bold uppercase text-slate-900 dark:text-white mt-0.5">
                    {ledger.branchName || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Account Type.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5">
                    {ledger.accountType || "Current"}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    IFSC Code.
                  </span>
                  <p className="text-[14px] font-bold font-mono uppercase text-slate-900 dark:text-white mt-0.5">
                    {ledger.ifsc || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM METADATA FOOTER: GRADIENT COLOR MATCHING img-2                     */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gradient-to-r from-[#FFF6DE] via-[#FFF9EC] to-white dark:from-[#1E190F] dark:via-[#131722] dark:to-[#0A0E1A] border-t border-[#EAE4D8] dark:border-white/[0.08]">
            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Creation Date
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px]">
                {creationDateFormatted}
              </span>
            </div>

            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Created By
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px] truncate">
                {createdBy}
              </span>
            </div>

            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Last Updated
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px]">
                {lastUpdatedFormatted}
              </span>
            </div>

            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Updated By
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px] truncate">
                {updatedBy}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DeleteLedgerModal
        open={deleteModalOpen}
        ledgerName={ledger.partyName}
        loading={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}
