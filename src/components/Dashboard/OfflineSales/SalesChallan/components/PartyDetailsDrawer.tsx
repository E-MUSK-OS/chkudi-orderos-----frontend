"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  UserPlus,
  Search,
  Check,
  ChevronsUpDown,
  PlusCircle,
} from "lucide-react";
import { Party, PartyPendingOrder } from "../types/challan.types";
import { challanService } from "../services/challan.service";
import LedgerBookModal from "./LedgerBookModal";
import { toast } from "sonner";

interface PartyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedParty: Party | null;
  onSelectParty: (party: Party | null) => void;
  onImportPendingOrders?: (orders: PartyPendingOrder[]) => void;
}

export default function PartyDetailsDrawer({
  isOpen,
  onClose,
  selectedParty,
  onSelectParty,
  onImportPendingOrders,
}: PartyDetailsDrawerProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Pending orders state
  const [pendingOrders, setPendingOrders] = useState<PartyPendingOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Ledger book modal for adding new Sundry Debtors
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close dropdown on click outside
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

  // Fetch parties list
  useEffect(() => {
    let isMounted = true;
    const fetchParties = async () => {
      try {
        setLoadingParties(true);
        const data = await challanService.getParties(partySearch);
        if (isMounted) setParties(data);
      } catch (err) {
        console.error("Failed to load parties", err);
      } finally {
        if (isMounted) setLoadingParties(false);
      }
    };

    const timer = setTimeout(fetchParties, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [partySearch]);

  // Fetch pending orders whenever selectedParty changes
  useEffect(() => {
    if (!selectedParty?.id) {
      setPendingOrders([]);
      setSelectedOrderIds([]);
      return;
    }

    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const orders = await challanService.getPartyPendingOrders(
          selectedParty.id
        );
        if (isMounted) {
          setPendingOrders(orders);
          setSelectedOrderIds([]);
        }
      } catch (err) {
        console.error("Failed to fetch pending orders", err);
        if (isMounted) setPendingOrders([]);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [selectedParty?.id]);

  // Toggle order checkbox
  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === pendingOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map((o) => o.id));
    }
  };

  const handleConfirm = () => {
    if (selectedOrderIds.length > 0 && onImportPendingOrders) {
      const chosen = pendingOrders.filter((o) => selectedOrderIds.includes(o.id));
      onImportPendingOrders(chosen);
      toast.success(
        `Imported ${chosen.length} item(s) from pending orders for ${selectedParty?.partyName || "party"
        }.`
      );
    }
    onClose();
  };

  const fullAddress = selectedParty
    ? [
      selectedParty.addressLine1,
      selectedParty.city,
      selectedParty.state,
    ]
      .filter(Boolean)
      .join(", ") || "—"
    : "—";

  return (
    <>
      {/* Backdrop scoped below top header & filter bar */}
      <div
        className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm rounded-none transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer scoped inside content area below top header matching Image 2 */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans overflow-hidden ${isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
          }`}
      >
        {/* Header matching Image 2 */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Party Details & Pending Orders
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
          {/* CARD 1: Select Party + Party Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141A29] p-3.5 sm:p-4 space-y-3.5">
            {/* Select Party Label and Dropdown with UserPlus button */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Party
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full h-9 sm:h-10 px-3.5 flex items-center justify-between rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${dropdownOpen
                    ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-white dark:bg-[#1D253B]"
                    : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1D253B] text-slate-900 dark:text-white"
                    }`}
                >
                  <span className="truncate">
                    {selectedParty?.partyName || "Select..."}
                  </span>
                  <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* Add New Party Button */}
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

              {/* Dropdown Menu with Search */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="relative mb-2 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      placeholder="Search debtor..."
                      className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-48 custom-scrollbar space-y-0.5">
                    {loadingParties ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Loading parties...
                      </div>
                    ) : parties.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No party found.
                      </div>
                    ) : (
                      parties.map((p) => {
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
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${isSelected
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

            {/* Row 2: Avatar Box on Left + 4 Info Cards */}
            <div className="flex items-stretch gap-3">
              {/* Avatar Box on Left */}
              <div className="w-20 sm:w-24 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shrink-0 text-slate-700 dark:text-white">
                <User className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
              </div>

              {/* 2x2 Grid of 4 rounded boxes */}
              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                {/* 1. Name Card */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Name
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {selectedParty?.partyName || "—"}
                  </p>
                </div>

                {/* 2. Mobile Card */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Mobile
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
                    {selectedParty?.phone || selectedParty?.whatsapp || "—"}
                  </p>
                </div>

                {/* 3. Address Card */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Address
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white text-[11px] line-clamp-2 mt-0.5">
                    {fullAddress}
                  </p>
                </div>

                {/* 4. GST Card */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    GST
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
                    {selectedParty?.gstin || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PENDING ORDERS Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#141A29]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FEFAEE] dark:bg-[#1D253B] border-b border-[#F5E6BE] dark:border-white/[0.08] font-bold text-[#6A4D1D] dark:text-white select-none whitespace-nowrap">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                      No.
                    </th>
                    <th className="py-2.5 px-2 w-9 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                      <input
                        type="checkbox"
                        checked={
                          pendingOrders.length > 0 &&
                          selectedOrderIds.length === pendingOrders.length
                        }
                        onChange={handleToggleSelectAll}
                        disabled={pendingOrders.length === 0}
                        className="rounded border-slate-300 dark:border-white/20 text-[#E8C16D] focus:ring-[#E8C16D] cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-bold border-r border-[#F5E6BE] dark:border-white/[0.08]">
                      Order No.
                    </th>
                    <th className="py-2.5 px-3 font-bold border-r border-[#F5E6BE] dark:border-white/[0.08]">
                      Date.
                    </th>
                    <th className="py-2.5 px-3 font-bold text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">
                      Total Qty.
                    </th>
                    <th className="py-2.5 px-3 font-bold text-left">
                      Sales For
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Loading pending orders...
                      </td>
                    </tr>
                  ) : pendingOrders.length === 0 ? (
                    /* Empty state matching Image 1 */
                    <tr>
                      <td colSpan={6} className="py-14 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl select-none" role="img" aria-label="No orders">
                            📋
                          </span>
                          <p className="text-xs font-semibold text-slate-400">
                            No pending orders
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingOrders.map((ord, idx) => {
                      const isSelected = selectedOrderIds.includes(ord.id);
                      return (
                        <tr
                          key={ord.id}
                          onClick={() => handleToggleOrder(ord.id)}
                          className={`border-b border-slate-100 dark:border-white/[0.04] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${isSelected
                            ? "bg-[#FFF9EC] dark:bg-[#1A160E]/50 text-[#B88728] dark:text-[#E8C16D]"
                            : "text-slate-800 dark:text-slate-200"
                            }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100 dark:border-white/[0.04]">
                            {idx + 1}
                          </td>
                          <td
                            className="py-2.5 px-2 text-center border-r border-slate-100 dark:border-white/[0.04]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleOrder(ord.id)}
                              className="rounded border-slate-300 dark:border-white/20 text-[#E8C16D] focus:ring-[#E8C16D] cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-semibold font-mono text-[11px] border-r border-slate-100 dark:border-white/[0.04]">
                            {ord.orderNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-white/[0.04] whitespace-nowrap">
                            {ord.date}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] border-r border-slate-100 dark:border-white/[0.04]">
                            {ord.totalQty}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {ord.salesFor || "Product"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom inside the Pending Orders card: [+ OK] Button */}
            <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0A0E1A] hover:bg-[#161D2E] text-[#E8C16D] dark:bg-[#1D253B] dark:hover:bg-white/[0.1] dark:text-white border border-transparent dark:border-white/[0.1] font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                <span>OK</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Book Modal to Create New Party */}
      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        onPartyCreated={(party) => {
          onSelectParty(party);
        }}
      />
    </>
  );
}
