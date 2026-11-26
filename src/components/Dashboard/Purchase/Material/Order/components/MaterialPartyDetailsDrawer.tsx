"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, User, UserPlus, Search, Check, ChevronsUpDown } from "lucide-react";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import { MaterialOrderParty } from "../types/materialOrder.types";

interface MaterialPartyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parties: MaterialOrderParty[];
  loadingParties?: boolean;
  selectedParty: MaterialOrderParty | null;
  onSelectParty: (party: MaterialOrderParty) => void;
  onPartyCreated?: (party: MaterialOrderParty) => void;
}

export default function MaterialPartyDetailsDrawer({
  isOpen,
  onClose,
  parties,
  loadingParties = false,
  selectedParty,
  onSelectParty,
  onPartyCreated,
}: MaterialPartyDetailsDrawerProps) {
  const [partySearch, setPartySearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
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
      {/* Backdrop scoped below top header */}
      <div
        className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm rounded-none transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer scoped inside content area below top header */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans overflow-hidden ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Party Details
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
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141A29] p-3.5 sm:p-4 space-y-3.5">
            {/* Select Party Dropdown + UserPlus Button */}
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
                <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
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

            {/* Avatar Box + 2x2 Info Grid */}
            <div className="flex items-stretch gap-3">
              <div className="w-20 sm:w-24 rounded-xl bg-white dark:bg-[#1D253B] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shrink-0 text-slate-700 dark:text-white">
                <User className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
              </div>

              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
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
        </div>
      </div>

      {/* Ledger Book Modal to Create New Party */}
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
