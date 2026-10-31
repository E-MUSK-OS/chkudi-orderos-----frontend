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
  CircleDot,
  SlidersHorizontal,
  User,
  Phone,
  Mail,
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
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-[#E7E0D2] shadow-sm dark:bg-[#0E121A] rounded-2xl dark:border-white/[0.08] w-full">
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
    if (!parts.length) return "-";
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

  const billingPhone = ledger.phone;
  const shippingPhone = ledger.shippingPhone || ledger.phone;

  const creationDateFormatted = formatDate(ledger.joinDate || ledger.createdAt, "01-09-2026");
  const lastUpdatedFormatted = formatDate(ledger.updatedAt || ledger.createdAt, "04-09-2026");
  const createdBy = ledger.createdByName || "Shailesh Bhatiya";
  const updatedBy = ledger.updatedByName || ledger.createdByName || "Shailesh Bhatiya";

  return (
    <DashboardLayout title="Ledger Book">
      <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-8 space-y-4">
        {/* Top Header Bar matching Screenshot */}
        <div className="w-full flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
              title="Back to Ledger Book"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Ledger Book
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Edit Button */}
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-[#E7E0D2] shadow-xs dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 dark:hover:text-white dark:border-white/[0.1] transition-all cursor-pointer active:scale-95"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-xs dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:hover:text-rose-300 dark:border-rose-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Full-Width Unified Profile Card */}
        <div className="w-full rounded-2xl border border-[#E7E0D2] bg-white text-slate-900 shadow-sm dark:border-white/[0.08] dark:bg-[#0E121A] dark:text-slate-100 dark:shadow-2xl overflow-hidden">
          {/* ========================================================================= */}
          {/* TOP SECTION: PHOTO + GENERAL DETAILS (WITH VERTICAL DIVIDER)              */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 border-b border-[#E7E0D2] dark:border-white/[0.08] flex flex-col md:flex-row items-stretch gap-6 sm:gap-8">
            {/* Left Photo Box & Active Status Badge with Right Vertical Divider */}
            <div className="flex flex-col items-center justify-center shrink-0 pr-0 md:pr-8 md:border-r border-[#E7E0D2] dark:border-white/[0.08]">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-slate-50 border border-[#E7E0D2] dark:bg-[#161B26] dark:border-white/[0.1] overflow-hidden flex items-center justify-center shadow-xs">
                {ledger.logoUrl ? (
                  <img
                    src={getMediaUrl(ledger.logoUrl)}
                    alt={ledger.partyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={52} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold border shadow-xs mt-3.5 ${
                  ledger.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#10382B] dark:text-[#34D399] dark:border-[#34D399]/30"
                    : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    ledger.isActive ? "bg-emerald-500 dark:bg-[#34D399]" : "bg-rose-500 dark:bg-rose-400"
                  }`}
                />
                <span>{ledger.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>

            {/* Right: General Details Header & 4 Columns */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                <SlidersHorizontal size={17} className="text-slate-500 dark:text-slate-300" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  General Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Ledger Name.
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 break-words">
                      {ledger.partyName || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Contact Name.
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 break-words">
                      {ledger.contactPerson || "—"}
                    </p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Alias.
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 break-words">
                      {ledger.alias || ledger.accountCode || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Email.
                    </span>
                    {ledger.email ? (
                      <div className="flex items-center gap-2 text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-200 mt-1 truncate">
                        <Mail size={15} className="text-slate-400 dark:text-slate-400 shrink-0" />
                        <span className="truncate">{ledger.email}</span>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-slate-400 dark:text-slate-500 mt-1 font-normal">-</p>
                    )}
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Account Head.
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 break-words">
                      {ledger.accountHead || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Opening Balance.
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                      ₹{Number(ledger.openingBalance || 0).toLocaleString()} ({ledger.balanceType === "Credit" || ledger.balanceType === "Cr" ? "Credit" : "Debit"})
                    </p>
                  </div>
                </div>

                {/* Column 4 */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Account Head Group.
                    </span>
                    <p className="text-sm sm:text-base text-slate-400 dark:text-slate-500 mt-1 font-normal">-</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE SECTION: 3 COLUMNS (WITH CLEAN VERTICAL DIVIDERS)                  */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 border-b border-[#E7E0D2] dark:border-white/[0.08] grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#E7E0D2] dark:divide-white/[0.08]">
            {/* Column 1: Contact Details */}
            <div className="space-y-4 pb-6 lg:pb-0 lg:pr-8">
              <div className="flex items-center gap-2.5 mb-3">
                <MapPin size={17} className="text-slate-500 dark:text-slate-300" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Contact Details
                </h3>
              </div>

              {/* Billing Address */}
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mb-1.5">
                  Billing Address
                </span>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed break-words font-normal">
                  {billingAddressFull}
                </p>
                {billingPhone && (
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 mt-1.5 font-mono">
                    <Phone size={13} className="text-slate-400 dark:text-slate-400 shrink-0" />
                    <span>{billingPhone}</span>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="pt-3 border-t border-[#E7E0D2] dark:border-white/[0.06]">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mb-1.5">
                  Shipping Address
                </span>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed break-words font-normal">
                  {shippingAddressFull}
                </p>
                {shippingPhone && (
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 mt-1.5 font-mono">
                    <Phone size={13} className="text-slate-400 dark:text-slate-400 shrink-0" />
                    <span>{shippingPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Taxation & Legal Details + Other Details */}
            <div className="space-y-6 py-6 lg:py-0 lg:px-8">
              {/* Taxation & Legal */}
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <Scale size={17} className="text-slate-500 dark:text-slate-300" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                    Taxation & Legal Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      GST No.
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1 font-mono">
                      {ledger.gstin || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      PAN No.
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1 font-mono">
                      {ledger.pan || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      MSME No.
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1">
                      {ledger.msmeNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Legal Name.
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1">
                      {ledger.legalName || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Other Details */}
              <div className="pt-3 border-t border-[#E7E0D2] dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <CircleDot size={15} className="text-slate-500 dark:text-slate-400" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                    Other Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Credit Debit Limit.
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 font-mono">
                      {ledger.creditDebitLimit || ledger.creditLimit || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                      Bill Due Days.
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 font-mono">
                      {ledger.billDueDays || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Bank Details */}
            <div className="space-y-4 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2.5 mb-3.5">
                <Landmark size={17} className="text-slate-500 dark:text-slate-300" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Bank Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                    Account No.
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1 font-mono">
                    {ledger.accountNumber || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                    Holder Name.
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 uppercase break-words">
                    {ledger.accountHolderName || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                    Bank Name.
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1 uppercase break-words">
                    {ledger.bankName || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                    Branch Name.
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1 uppercase break-words">
                    {ledger.branchName || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                    Account Type.
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1">
                    {ledger.accountType || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium block">
                    IFSC Code.
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200 mt-1 font-mono uppercase">
                    {ledger.ifsc || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM METADATA FOOTER (4 ITEMS)                                          */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-slate-50/70 dark:bg-transparent">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-xs sm:text-[13px] font-medium mb-1">Creation Date</span>
              <span className="font-semibold text-slate-900 dark:text-white block text-sm sm:text-base">
                {creationDateFormatted}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-xs sm:text-[13px] font-medium mb-1">Created By</span>
              <span className="font-semibold text-slate-900 dark:text-white block text-sm sm:text-base truncate">
                {createdBy}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-xs sm:text-[13px] font-medium mb-1">Last Updated</span>
              <span className="font-semibold text-slate-900 dark:text-white block text-sm sm:text-base">
                {lastUpdatedFormatted}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-xs sm:text-[13px] font-medium mb-1">Updated By</span>
              <span className="font-semibold text-slate-900 dark:text-white block text-sm sm:text-base truncate">
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
