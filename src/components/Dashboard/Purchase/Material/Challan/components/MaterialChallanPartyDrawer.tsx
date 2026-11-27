"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  User,
  UserPlus,
  Search,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import { MaterialOrderParty } from "../../Order/types/materialOrder.types";
import { PendingMaterialOrder } from "../types/materialChallan.types";
import { materialChallanService } from "../services/materialChallan.service";

interface MaterialChallanPartyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parties: MaterialOrderParty[];
  loadingParties?: boolean;
  selectedParty: MaterialOrderParty | null;
  onSelectParty: (party: MaterialOrderParty) => void;
  onPartyCreated?: (party: MaterialOrderParty) => void;
  onImportPendingOrders: (orders: PendingMaterialOrder[]) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;
}

export default function MaterialChallanPartyDrawer({
  isOpen,
  onClose,
  parties,
  loadingParties = false,
  selectedParty,
  onSelectParty,
  onPartyCreated,
  onImportPendingOrders,
}: MaterialChallanPartyDrawerProps) {
  const [partySearch, setPartySearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  const [pendingOrders, setPendingOrders] = useState<PendingMaterialOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedParty?.id) {
      setPendingOrders([]);
      setSelectedOrderIds([]);
      return;
    }
    let active = true;
    setLoadingOrders(true);
    materialChallanService
      .getPendingOrders(selectedParty.id)
      .then((list) => {
        if (active) {
          setPendingOrders(list);
          setSelectedOrderIds([]);
        }
      })
      .catch(() => {
        if (active) setPendingOrders([]);
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });
    return () => {
      active = false;
    };
  }, [selectedParty?.id]);

  const filteredParties = parties.filter((p) =>
    p.partyName?.toLowerCase().includes(partySearch.trim().toLowerCase())
  );

  const fullAddress = selectedParty
    ? [selectedParty.addressLine1, selectedParty.city, selectedParty.state, selectedParty.pincode]
        .filter(Boolean)
        .join(", ") || "—"
    : "—";

  const toggleOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedOrderIds.length === pendingOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map((o) => o.id));
    }
  };

  const handleConfirm = () => {
    if (pendingOrders.length > 0) {
      const chosen =
        selectedOrderIds.length > 0
          ? pendingOrders.filter((o) => selectedOrderIds.includes(o.id))
          : pendingOrders;
      if (chosen.length > 0) {
        onImportPendingOrders(chosen);
        toast.success(`Imported items from ${chosen.length} pending order(s).`);
      }
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm rounded-none transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans overflow-hidden ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Party Details &amp; Pending Orders
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
          {/* Card 1: Select Party + Party Info */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141A29] p-3.5 sm:p-4 space-y-3.5">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Party
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full h-9 sm:h-10 px-3.5 flex items-center justify-between rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    dropdownOpen
                      ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-white dark:bg-[#1D253B]"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1D253B] text-slate-900 dark:text-white"
                  }`}
                >
                  <span className="truncate">{selectedParty?.partyName || "Select..."}</span>
                  <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setLedgerModalOpen(true);
                  }}
                  title="Create New Party (Ledger Book)"
                  className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#1D253B] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl max-h-64 overflow-hidden flex flex-col">
                  <div className="relative mb-2 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      placeholder="Search party..."
                      className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-48 custom-scrollbar space-y-0.5">
                    {loadingParties ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Loading parties...
                      </div>
                    ) : filteredParties.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No party found.
                      </div>
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
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                            }`}
                          >
                            <div>
                              <p className="font-semibold">{p.partyName}</p>
                              {(p.phone || p.city) && (
                                <p className="text-[10px] text-slate-400">
                                  {[p.phone, p.city, p.state].filter(Boolean).join(" • ")}
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

          {/* Card 2: Pending Orders Table */}
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
                          pendingOrders.length > 0 &&
                          selectedOrderIds.length === pendingOrders.length
                        }
                        disabled={pendingOrders.length === 0}
                        onChange={toggleAll}
                        className="rounded accent-[#B88728] cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Order No.</th>
                    <th className="py-2.5 px-3">Date.</th>
                    <th className="py-2.5 px-3 text-right">Pending Qty.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading pending orders...
                      </td>
                    </tr>
                  ) : pendingOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                          <ClipboardList className="w-6 h-6 text-[#B88728]/60 dark:text-[#E8C16D]/60" />
                          <span className="text-xs font-medium">No pending orders</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingOrders.map((ord, idx) => {
                      const isChecked = selectedOrderIds.includes(ord.id);
                      return (
                        <tr
                          key={ord.id}
                          onClick={() => toggleOrder(ord.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-[#FFF9EC]/70 dark:bg-emerald-500/[0.08]"
                              : "hover:bg-[#FFF9EC]/50 dark:hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrder(ord.id);
                              }}
                              className={`inline-flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                                isChecked
                                  ? "text-emerald-500"
                                  : "text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D]"
                              }`}
                              title={isChecked ? "Selected" : "Select Order"}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {ord.orderNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {formatDate(ord.orderDate)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {Number(ord.totalPendingQty || 0).toFixed(2)}
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
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>OK</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        onPartyCreated={(party) => {
          const mapped: MaterialOrderParty = {
            id: party.id,
            partyName: party.partyName,
            phone: party.phone || undefined,
            whatsapp: party.whatsapp || undefined,
            gstNumber: party.gstin || undefined,
            addressLine1: party.addressLine1 || undefined,
            city: party.city || undefined,
            state: party.state || undefined,
          };
          onPartyCreated?.(mapped);
          onSelectParty(mapped);
        }}
      />
    </>
  );
}
