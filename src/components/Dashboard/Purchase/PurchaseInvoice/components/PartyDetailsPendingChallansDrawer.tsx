"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  UserPlus,
  PlusCircle,
  ClipboardList,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Party } from "@/components/Dashboard/Purchase/PurchaseChallan/types/purchaseChallan.types";
import { purchaseInvoiceService } from "../services/purchaseInvoice.service";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import { toast } from "sonner";

export interface PendingChallan {
  id: string;
  no: number;
  challanNo: string;
  partyChallanNo?: string;
  challanDate: string;
  totalQuantity: number;
  items: Array<{
    sku: string;
    particular: string;
    size?: string;
    quantity: number;
    rate: number;
    amount: number;
    lotNo?: string;
  }>;
}

interface PartyDetailsPendingChallansDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier: Party | null;
  onSelectSupplier: (supplier: Party) => void;
  onImportPendingChallans?: (challans: PendingChallan[]) => void;
}

export default function PartyDetailsPendingChallansDrawer({
  isOpen,
  onClose,
  selectedSupplier,
  onSelectSupplier,
  onImportPendingChallans,
}: PartyDetailsPendingChallansDrawerProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [pendingChallans, setPendingChallans] = useState<PendingChallan[]>([]);
  const [loadingChallans, setLoadingChallans] = useState(false);
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);

  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suppliers list
  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const data = await purchaseInvoiceService.getSuppliers(supplierSearch);
        if (isMounted) setSuppliers(data);
      } catch (err) {
        console.error("Failed to load suppliers", err);
      } finally {
        if (isMounted) setLoadingSuppliers(false);
      }
    };

    const timer = setTimeout(fetchSuppliers, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [supplierSearch]);

  // Fetch pending challans whenever selectedSupplier changes
  useEffect(() => {
    if (!selectedSupplier?.id) {
      setPendingChallans([]);
      setSelectedChallanIds([]);
      return;
    }

    let isMounted = true;
    const fetchChallans = async () => {
      try {
        setLoadingChallans(true);
        const list = await purchaseInvoiceService.getSupplierPendingChallans(
          selectedSupplier.id
        );
        if (isMounted) {
          setPendingChallans(list);
          setSelectedChallanIds([]);
        }
      } catch (err) {
        console.error("Failed to fetch pending challans", err);
        if (isMounted) setPendingChallans([]);
      } finally {
        if (isMounted) setLoadingChallans(false);
      }
    };

    fetchChallans();
    return () => {
      isMounted = false;
    };
  }, [selectedSupplier?.id]);

  // Toggle challan checkbox
  const handleToggleChallan = (challanId: string) => {
    setSelectedChallanIds((prev) =>
      prev.includes(challanId)
        ? prev.filter((id) => id !== challanId)
        : [...prev, challanId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedChallanIds.length === pendingChallans.length) {
      setSelectedChallanIds([]);
    } else {
      setSelectedChallanIds(pendingChallans.map((c) => c.id));
    }
  };

  const handleConfirm = () => {
    if (selectedChallanIds.length > 0 && onImportPendingChallans) {
      const chosen = pendingChallans.filter((c) => selectedChallanIds.includes(c.id));
      onImportPendingChallans(chosen);
      toast.success(
        `Imported items from ${chosen.length} pending challan(s) for ${selectedSupplier?.partyName || "supplier"
        }.`
      );
    }
    onClose();
  };

  const supplierAddr =
    (selectedSupplier as any)?.address1 || selectedSupplier?.addressLine1;
  const formattedAddress =
    selectedSupplier &&
      (supplierAddr ||
        selectedSupplier.city ||
        selectedSupplier.state ||
        selectedSupplier.pincode)
      ? [
        supplierAddr,
        selectedSupplier.city,
        selectedSupplier.state,
        selectedSupplier.pincode,
      ]
        .filter(Boolean)
        .join(", ")
      : "—";

  return (
    <>
      {/* Backdrop scoped below top header & filter bar */}
      <div
        className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm rounded-none transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer scoped inside content area below top header matching Image 4 */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans overflow-hidden ${isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
          }`}
      >
        {/* Drawer Header matching Image 4 */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Party Details & Pending Challans
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body matching Image 4 */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
          {/* CARD 1: Select Party + Party Details (Enclosed together in rounded container) */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#121620] p-3.5 sm:p-4 space-y-3.5">
            {/* Row 1: Select Party Label on Top + Full Width Dropdown + Plus Button */}
            <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Select Party
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full h-9 sm:h-10 px-3.5 flex items-center justify-between rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer ${dropdownOpen
                      ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-white dark:bg-[#171C28]"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                      }`}
                  >
                    <span className="truncate">
                      {selectedSupplier?.partyName || "Select..."}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>

                {/* Add New Supplier Button */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setLedgerModalOpen(true);
                  }}
                  title="Create New Supplier (Ledger Book)"
                  className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Full Width Dropdown Menu with Search matching User Reference */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="relative mb-2 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="Search supplier..."
                      className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-48 custom-scrollbar space-y-0.5">
                    {loadingSuppliers ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Loading suppliers...
                      </div>
                    ) : suppliers.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No supplier found.
                      </div>
                    ) : (
                      suppliers.map((s) => {
                        const isSelected = selectedSupplier?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onSelectSupplier(s);
                              setDropdownOpen(false);
                              setSupplierSearch("");
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${isSelected
                              ? "bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                              }`}
                          >
                            <div>
                              <p className="font-semibold">{s.partyName}</p>
                              {(s.phone || s.city) && (
                                <p className="text-[10px] text-slate-400">
                                  {[s.phone, s.city, s.state].filter(Boolean).join(" • ")}
                                </p>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Avatar Box on Left + 4 Rounded Info Cards in 2x2 Grid matching Image 4 */}
            <div className="flex items-stretch gap-3">
              {/* Left: Avatar / Person Icon Container */}
              <div className="w-20 sm:w-24 shrink-0 rounded-2xl bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center p-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              {/* Right: 2x2 Grid of Rounded Detail Boxes */}
              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                {/* Name Box */}
                <div className="rounded-xl bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.08] p-2 sm:p-2.5 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Name
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white truncate">
                    {selectedSupplier?.partyName || "—"}
                  </span>
                </div>

                {/* Mobile Box */}
                <div className="rounded-xl bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.08] p-2 sm:p-2.5 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Mobile
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white truncate font-mono">
                    {selectedSupplier?.phone || "—"}
                  </span>
                </div>

                {/* Address Box */}
                <div className="rounded-xl bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.08] p-2 sm:p-2.5 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Address
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white truncate" title={formattedAddress}>
                    {formattedAddress}
                  </span>
                </div>

                {/* GST Box */}
                <div className="rounded-xl bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.08] p-2 sm:p-2.5 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    GST
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white truncate font-mono">
                    {selectedSupplier?.gstin || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PENDING CHALLANS (Enclosed in rounded container with OK button) */}
          <div className="rounded-2xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#121620] overflow-hidden shadow-2xs">
            {/* Header / Title */}
            <div className="px-4 py-2.5 border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#171C28] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                Pending Challans
              </span>
              {pendingChallans.length > 0 && (
                <span className="text-[10px] font-bold text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] px-2 py-0.5 rounded-full border border-[#E8C16D]/30">
                  {selectedChallanIds.length} of {pendingChallans.length} selected
                </span>
              )}
            </div>

            {/* Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#0B0E14] text-[#6A4D1D] dark:text-[#E8C16D] font-bold divide-x divide-[#F5E6BE] dark:divide-white/[0.08]">
                  <th className="w-10 px-2 py-2 text-center">No.</th>
                  <th className="w-10 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={
                        pendingChallans.length > 0 &&
                        selectedChallanIds.length === pendingChallans.length
                      }
                      onChange={handleToggleSelectAll}
                      disabled={pendingChallans.length === 0}
                      className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/20 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#E8C16D] cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Challan No.</th>
                  <th className="px-3 py-2 text-left">Date.</th>
                  <th className="px-3 py-2 text-right">Qty.</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F5E6BE]/60 dark:divide-white/[0.04]">
                {loadingChallans ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading pending challans...
                    </td>
                  </tr>
                ) : pendingChallans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-[#B88728] dark:text-[#E8C16D] mb-2.5 shadow-2xs">
                          <ClipboardList className="h-7 w-7 text-[#B88728] dark:text-[#E8C16D]" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          No pending challans
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingChallans.map((challan, idx) => {
                    const isSelected = selectedChallanIds.includes(challan.id);
                    return (
                      <tr
                        key={challan.id}
                        onClick={() => handleToggleChallan(challan.id)}
                        className={`divide-x divide-slate-200 dark:divide-white/[0.08] transition-colors cursor-pointer ${isSelected
                          ? "bg-[#FFF9EC]/80 dark:bg-[#1A160E]/70"
                          : "hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
                          }`}
                      >
                        <td className="px-2 py-2 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td
                          className="px-2 py-2 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleChallan(challan.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/20 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#E8C16D] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-900 dark:text-white">
                          {challan.challanNo}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono">
                          {challan.challanDate}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {challan.totalQuantity}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Bottom inside the Pending Challans card: [+ OK] Button matching Image 4 */}
            <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-white font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>OK</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Action Bar matching Image 5 */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0E14] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl sm:rounded-2xl border border-[#E8C16D] bg-[#E8C16D] hover:bg-[#d9b15d] text-[#0A0E1A] font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>OK</span>
          </button>
        </div>
      </div>

      {/* Ledger Book Modal for creating new Sundry Creditor on the fly */}
      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        defaultAccountHead="Sundry Creditors"
        entityTitle="Supplier"
        onPartyCreated={(party: Party) => {
          onSelectSupplier(party);
          setLedgerModalOpen(false);
          toast.success(`Supplier "${party.partyName}" added and selected.`);
        }}
      />
    </>
  );
}
