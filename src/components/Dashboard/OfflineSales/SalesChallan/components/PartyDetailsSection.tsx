"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, X, Check, Building, Phone, Mail, MapPin } from "lucide-react";
import { Party } from "../types/challan.types";
import { challanService } from "../services/challan.service";

interface PartyDetailsSectionProps {
  selectedParty: Party | null;
  onSelectParty: (party: Party | null) => void;
  onOpenLedgerModal: () => void;
}

export default function PartyDetailsSection({
  selectedParty,
  onSelectParty,
  onOpenLedgerModal,
}: PartyDetailsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [partyList, setPartyList] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search parties on input change
  useEffect(() => {
    let active = true;
    const fetchParties = async () => {
      try {
        setLoading(true);
        const data = await challanService.getParties(searchTerm);
        if (active) setPartyList(data);
      } catch (err) {
        console.error("Failed to load parties", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchParties, 250);
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
        Party Details [Debtors]
      </h3>

      {/* Search Bar + Add Party Button */}
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
              placeholder="Search Party [Sundry Debtor]"
              className="w-full h-9 pl-8 pr-7 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add Party Button */}
          <button
            type="button"
            onClick={onOpenLedgerModal}
            title="Create New Party (Ledger Book)"
            className="h-9 w-9 bg-[#0A0E1A] hover:bg-[#161D2E] text-white dark:bg-[#F5C451] dark:text-[#080B11] dark:hover:bg-[#E8B83D] rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Dropdown */}
        {dropdownOpen && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] rounded-xl shadow-xl max-h-56 overflow-y-auto text-xs p-1">
            {loading ? (
              <div className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                Searching parties...
              </div>
            ) : partyList.length === 0 ? (
              <div className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                <p>No debtor party found.</p>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenLedgerModal();
                  }}
                  className="mt-1 text-[#B88728] dark:text-[#E8C16D] hover:underline font-semibold"
                >
                  + Add New Party
                </button>
              </div>
            ) : (
              partyList.map((party) => {
                const isSelected = selectedParty?.id === party.id;
                return (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => {
                      onSelectParty(party);
                      setDropdownOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border-b border-slate-100 dark:border-white/[0.04] last:border-none flex items-center justify-between hover:bg-[#FFF9EC]/60 dark:hover:bg-white/[0.04] transition-colors cursor-pointer ${
                      isSelected ? "bg-[#FFF9EC] dark:bg-white/[0.08]" : ""
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {party.partyName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        {party.accountCode && <span>Code: {party.accountCode}</span>}
                        {party.phone && <span>Ph: {party.phone}</span>}
                        {party.city && <span>City: {party.city}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Party Summary Card */}
      {selectedParty ? (
        <div className="border border-[#E8C16D]/40 bg-[#FFF9EC]/50 dark:border-[#E8C16D]/20 dark:bg-[#E8C16D]/5 rounded-2xl p-4 text-xs space-y-2.5 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedParty.partyName}
              </div>
              <div className="text-[11px] text-[#B88728] dark:text-[#E8C16D] font-semibold mt-0.5">
                {selectedParty.accountHead || "Sundry Debtors"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectParty(null)}
              title="Remove party selection"
              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-slate-600 dark:text-slate-300 pt-2 border-t border-[#E8C16D]/20">
            {selectedParty.contactPerson && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-500 dark:text-slate-400">Contact:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedParty.contactPerson}</span>
              </div>
            )}
            {selectedParty.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedParty.phone}</span>
              </div>
            )}
            {selectedParty.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedParty.email}</span>
              </div>
            )}
            {(selectedParty.addressLine1 || selectedParty.city || selectedParty.area) && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {[
                    selectedParty.addressLine1,
                    selectedParty.addressLine2,
                    selectedParty.addressLine3,
                    selectedParty.area,
                    selectedParty.city,
                    selectedParty.state,
                    selectedParty.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {selectedParty.gstin && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-500 dark:text-slate-400">GSTIN:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedParty.gstin}</span>
              </div>
            )}
            {selectedParty.pan && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-500 dark:text-slate-400">PAN:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedParty.pan}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-2 border-t border-[#E8C16D]/20">
              <span className="font-medium text-slate-500 dark:text-slate-400">Balance:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{selectedParty.openingBalance?.toFixed(2) || "0.00"}{" "}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({selectedParty.balanceType || "Credit"})
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 text-center text-xs text-slate-400 dark:text-slate-500 flex-1 flex flex-col items-center justify-center">
          <Building className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No debtor selected.</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Search from existing debtors or click the <span className="font-bold text-slate-800 dark:text-white">+ button</span> above to add.
          </p>
        </div>
      )}
    </div>
  );
}
