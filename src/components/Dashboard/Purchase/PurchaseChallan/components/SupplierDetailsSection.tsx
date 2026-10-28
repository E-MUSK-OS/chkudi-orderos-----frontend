"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, X, Building, Phone, Mail, MapPin } from "lucide-react";
import { Party } from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";

interface SupplierDetailsSectionProps {
  selectedSupplier: Party | null;
  onSelectSupplier: (supplier: Party | null) => void;
  onOpenLedgerModal: () => void;
}

export default function SupplierDetailsSection({
  selectedSupplier,
  onSelectSupplier,
  onOpenLedgerModal,
}: SupplierDetailsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierList, setSupplierList] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search parties on input change (defaults to Sundry Creditors)
  useEffect(() => {
    let active = true;
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await purchaseChallanService.getSuppliers(searchTerm, "Sundry Creditors");
        if (active) setSupplierList(data);
      } catch (err) {
        console.error("Failed to load suppliers", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuppliers, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 h-full flex flex-col shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
        Supplier Details [Creditor]
      </h3>

      {/* Search Bar + Add Creditor Button */}
      <div className="relative mb-3" ref={containerRef}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              placeholder="Search Party [Sundry Creditor]"
              className="w-full h-9 pl-8 pr-7 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add Creditor Button (Gold button with UserPlus) */}
          <button
            type="button"
            onClick={onOpenLedgerModal}
            title="Add New Sundry Creditor"
            className="h-9 w-9 bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 hover:bg-[#F5C451] hover:text-[#0A0E1A] dark:bg-[#1A160E] dark:text-[#E8C16D] dark:hover:bg-[#F5C451] dark:hover:text-[#0A0E1A] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Suggestions */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] rounded-xl shadow-lg z-50 divide-y divide-slate-100 dark:divide-white/[0.04]">
            {loading ? (
              <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                Searching creditors...
              </div>
            ) : supplierList.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                No sundry creditors found.
              </div>
            ) : (
              supplierList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectSupplier(p);
                    setDropdownOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {p.partyName}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>{p.city || "Unknown City"}</span>
                    {p.phone && <span>• {p.phone}</span>}
                    {p.gstin && <span>• GST: {p.gstin}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Supplier Card */}
      {selectedSupplier ? (
        <div className="flex-1 bg-slate-50 dark:bg-[#080B11]/60 rounded-xl p-3 border border-slate-200 dark:border-white/[0.06] text-xs relative flex flex-col justify-between">
          <button
            type="button"
            onClick={() => onSelectSupplier(null)}
            className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            title="Deselect Supplier"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="space-y-1.5 pr-5">
            <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
              {selectedSupplier.partyName}
            </p>
            {selectedSupplier.contactPerson && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Attn: {selectedSupplier.contactPerson}
              </p>
            )}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
              {selectedSupplier.addressLine1 && (
                <p className="truncate">
                  {selectedSupplier.addressLine1}
                  {selectedSupplier.city ? `, ${selectedSupplier.city}` : ""}
                </p>
              )}
              {selectedSupplier.phone && (
                <p className="flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                  <span>{selectedSupplier.phone}</span>
                </p>
              )}
              {selectedSupplier.gstin && (
                <p className="font-mono text-[10px] text-[#B88728] dark:text-[#E8C16D]">
                  GST: {selectedSupplier.gstin}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
          <Building className="w-6 h-6 mb-1 opacity-40 text-[#E8C16D]" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">No supplier selected</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Search above or click + to create new creditor</span>
        </div>
      )}
    </div>
  );
}
