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
import { Party, SupplierPendingOrder } from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import { toast } from "sonner";

interface PartyDetailsPendingOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier: Party | null;
  onSelectSupplier: (supplier: Party | null) => void;
  onImportPendingOrders?: (orders: SupplierPendingOrder[]) => void;
}

export default function PartyDetailsPendingOrdersDrawer({
  isOpen,
  onClose,
  selectedSupplier,
  onSelectSupplier,
  onImportPendingOrders,
}: PartyDetailsPendingOrdersDrawerProps) {
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Pending orders state
  const [pendingOrders, setPendingOrders] = useState<SupplierPendingOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Ledger book modal for adding new Sundry Creditors
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch suppliers list
  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const data = await purchaseChallanService.getSuppliers(supplierSearch);
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

  // Fetch pending orders whenever selectedSupplier changes
  useEffect(() => {
    if (!selectedSupplier?.id) {
      setPendingOrders([]);
      setSelectedOrderIds([]);
      return;
    }

    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const orders = await purchaseChallanService.getSupplierPendingOrders(
          selectedSupplier.id
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
  }, [selectedSupplier?.id]);

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
        `Imported ${chosen.length} item(s) from pending orders for ${selectedSupplier?.partyName || "supplier"
        }.`
      );
    }
    onClose();
  };

  const fullAddress = selectedSupplier
    ? [
      selectedSupplier.addressLine1,
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

      {/* Slide-over Drawer scoped inside content area below top header */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans overflow-hidden ${isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
          }`}
      >
        {/* Drawer Header matching Image 2 */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Party Details & Pending Orders
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body matching Image 2 */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
          {/* CARD 1: Select Party + Party Details (Enclosed together in rounded container) */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#121620] p-3.5 sm:p-4 space-y-3.5">
            {/* Row 1: Select Party Label + Dropdown + Plus Button */}
            <div className="flex items-center gap-2.5 sm:gap-3 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                Select Party
              </label>

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

              {/* Full Width Dropdown Menu with Search matching User Reference */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
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

            {/* Row 2: Avatar Box on Left + 4 Rounded Info Cards in 2x2 Grid matching Image 2 */}
            <div className="flex items-stretch gap-3">
              {/* Avatar Box on Left */}
              <div className="w-24 sm:w-28 rounded-xl bg-slate-100 dark:bg-[#171C28] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center shrink-0 text-slate-600 dark:text-white">
                <User className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.5]" />
              </div>

              {/* 2x2 Grid of 4 distinct rounded boxes matching Image 2 */}
              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                {/* 1. Name Card */}
                <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-[#171C28] border border-slate-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                    Name
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {selectedSupplier?.partyName || "—"}
                  </p>
                </div>

                {/* 2. Mobile Card */}
                <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-[#171C28] border border-slate-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                    Mobile
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
                    {selectedSupplier?.phone || selectedSupplier?.whatsapp || "—"}
                  </p>
                </div>

                {/* 3. Address Card */}
                <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-[#171C28] border border-slate-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                    Address
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white text-[11px] line-clamp-2 mt-0.5">
                    {fullAddress}
                  </p>
                </div>

                {/* 4. GST Card */}
                <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-[#171C28] border border-slate-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                    GST
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate font-mono mt-0.5">
                    {selectedSupplier?.gstin || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PENDING ORDERS Table with vertical dividing lines and inside OK button matching Image 2 */}
          <div className="rounded-2xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 overflow-hidden bg-white dark:bg-[#121620]">
            {/* Table Header with Vertical Divider Lines */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] font-bold text-[#6A4D1D] dark:text-[#E8C16D] select-none whitespace-nowrap">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    No.
                  </th>
                  <th className="py-2.5 px-2 w-10 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
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
                    Lot No.
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    Order No.
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right">
                    Total Qty.
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingOrders ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      Loading pending orders...
                    </td>
                  </tr>
                ) : pendingOrders.length === 0 ? (
                  /* Empty state matching Image 2 clipboard graphic */
                  <tr>
                    <td colSpan={5} className="py-14 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        {/* Amber/Wood Clipboard with sheet matching Image 2 */}
                        <div className="w-12 h-16 rounded-xl bg-[#DDA368] p-1.5 relative flex flex-col items-center shadow-xs">
                          {/* Top metallic clip */}
                          <div className="w-6 h-2 bg-slate-300 rounded-t-xs -mt-2 shadow-xs border border-slate-400" />
                          {/* White sheet inside */}
                          <div className="w-full h-full bg-white rounded-md p-1.5 flex flex-col justify-center gap-1.5">
                            <div className="h-1 bg-slate-300 rounded-full w-full" />
                            <div className="h-1 bg-slate-300 rounded-full w-full" />
                            <div className="h-1 bg-slate-300 rounded-full w-3/4" />
                            <div className="h-1 bg-slate-300 rounded-full w-1/2" />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                        className={`border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${isSelected
                          ? "bg-[#FFF9EC]/60 dark:bg-[#1A160E]/40"
                          : ""
                          }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px] border-r border-slate-100 dark:border-white/[0.04]">
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
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-white/[0.04]">
                          {ord.lotNo || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px] border-r border-slate-100 dark:border-white/[0.04]">
                          {ord.orderNo || ord.poNo || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#E8C16D]">
                          {ord.totalQty}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Bottom inside the Pending Orders card: [+ OK] Button matching Image 2 */}
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
