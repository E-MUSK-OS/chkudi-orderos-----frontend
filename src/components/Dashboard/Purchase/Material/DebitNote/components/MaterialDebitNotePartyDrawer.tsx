"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ClipboardList, Search, User, UserPlus, X } from "lucide-react";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import { MaterialOrderParty } from "../../Order/types/materialOrder.types";
import { MaterialPurchaseInvoice } from "../../Invoice/types/materialInvoice.types";

interface MaterialDebitNotePartyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parties: MaterialOrderParty[];
  loadingParties: boolean;
  selectedParty: MaterialOrderParty | null;
  onSelectParty: (party: MaterialOrderParty) => void;
  onPartyCreated?: (party: MaterialOrderParty) => void;
  invoices?: MaterialPurchaseInvoice[];
  loadingInvoices?: boolean;
  onImportInvoices?: (invoices: MaterialPurchaseInvoice[]) => void;
}

function formatInvDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;
}

export default function MaterialDebitNotePartyDrawer({
  isOpen,
  onClose,
  parties,
  loadingParties,
  selectedParty,
  onSelectParty,
  onPartyCreated,
  invoices = [],
  loadingInvoices = false,
  onImportInvoices,
}: MaterialDebitNotePartyDrawerProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedInvoiceIds([]);
  }, [selectedParty?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredParties = parties.filter((p) =>
    p.partyName?.toLowerCase().includes(partySearch.trim().toLowerCase())
  );

  const fullAddress = selectedParty
    ? [selectedParty.addressLine1, selectedParty.city, selectedParty.state, selectedParty.pincode]
        .filter(Boolean)
        .join(", ") || "—"
    : "—";

  return (
    <>
      <div
        className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm rounded-none transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans overflow-hidden ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {onImportInvoices ? "Party Details & Invoices" : "Party Details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 pb-5 space-y-4 custom-scrollbar">
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141A29] p-3 sm:p-4 space-y-3">
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <label className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                  Select Party
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex-1 min-w-0 flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0B0E14] text-xs font-semibold text-slate-900 dark:text-white hover:border-[#E8C16D]/60 transition-colors cursor-pointer"
                >
                  <span className="truncate">
                    {loadingParties
                      ? "Loading parties..."
                      : selectedParty?.partyName || "Select..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setLedgerModalOpen(true);
                  }}
                  title="Create New Party (Ledger Book)"
                  className="p-2 rounded-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:border-[#E8C16D]/50 transition-colors shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0E14] shadow-2xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      placeholder="Search party..."
                      className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {filteredParties.length === 0 ? (
                      <p className="p-3 text-center text-xs text-slate-400">No parties found</p>
                    ) : (
                      filteredParties.map((p) => {
                        const isSelected = selectedParty?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              onSelectParty(p);
                              setDropdownOpen(false);
                              setPartySearch("");
                              if (!onImportInvoices) onClose();
                            }}
                            className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#FFF9EC] dark:hover:bg-[#1D253B] transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-bold"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate">{p.partyName}</div>
                              {p.phone && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {p.phone}
                                </div>
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

            <div className="flex items-stretch gap-3">
              <div className="hidden sm:flex w-20 sm:w-24 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06] items-center justify-center shrink-0 text-slate-700 dark:text-white">
                <User className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Name
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {selectedParty?.partyName || "—"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Mobile
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
                    {selectedParty?.phone || selectedParty?.whatsapp || "—"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Address
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white text-[11px] line-clamp-2 mt-0.5">
                    {fullAddress}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    GST
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
                    {selectedParty?.gstNumber || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {onImportInvoices && selectedParty && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141A29] p-3.5 sm:p-4 space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0F1626]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF9EC] dark:bg-[#1D253B] text-[#6A4D1D] dark:text-slate-300 border-b border-slate-200 dark:border-white/[0.06] text-[11px] font-bold">
                      <th className="py-2.5 px-3 w-12">No.</th>
                      <th className="py-2.5 px-2 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={
                            invoices.length > 0 &&
                            invoices.every((inv) => selectedInvoiceIds.includes(inv.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceIds(invoices.map((inv) => inv.id));
                            } else {
                              setSelectedInvoiceIds([]);
                            }
                          }}
                          className="rounded accent-[#B88728] cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">Invoice No.</th>
                      <th className="py-2.5 px-3">Date.</th>
                      <th className="py-2.5 px-3 text-right">Amount.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {loadingInvoices ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Loading invoices...
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                            <ClipboardList className="w-6 h-6 text-[#B88728]/60 dark:text-[#E8C16D]/60" />
                            <span className="text-xs font-medium">
                              No purchase invoices found
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv, idx) => {
                        const isChecked = selectedInvoiceIds.includes(inv.id);
                        return (
                          <tr
                            key={inv.id}
                            onClick={() =>
                              setSelectedInvoiceIds((prev) =>
                                prev.includes(inv.id)
                                  ? prev.filter((id) => id !== inv.id)
                                  : [...prev, inv.id]
                              )
                            }
                            className={`cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-[#FFF9EC]/70 dark:bg-emerald-500/[0.08]"
                                : "hover:bg-[#FFF9EC]/50 dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInvoiceIds((prev) =>
                                    prev.includes(inv.id)
                                      ? prev.filter((id) => id !== inv.id)
                                      : [...prev, inv.id]
                                  );
                                }}
                                className={`inline-flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                                  isChecked
                                    ? "text-emerald-500"
                                    : "text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D]"
                                }`}
                                title={isChecked ? "Selected" : "Select Invoice"}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                              {inv.invoiceNo}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatInvDate(inv.invoiceDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                              {Number(inv.netAmount || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const chosen = invoices.filter((inv) =>
                      selectedInvoiceIds.includes(inv.id)
                    );
                    if (chosen.length > 0) {
                      onImportInvoices(chosen);
                    }
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OK</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        onPartyCreated={(party) => {
          const mapped: MaterialOrderParty = {
            id: party.id,
            partyName: party.partyName,
            accountHead: party.accountHead,
            phone: party.phone || undefined,
            whatsapp: party.whatsapp || undefined,
            gstNumber: party.gstin || undefined,
            addressLine1: party.addressLine1 || undefined,
            city: party.city || undefined,
            state: party.state || undefined,
            pincode: party.pincode || undefined,
          };
          onPartyCreated?.(mapped);
          onSelectParty(mapped);
          setLedgerModalOpen(false);
        }}
      />
    </>
  );
}
