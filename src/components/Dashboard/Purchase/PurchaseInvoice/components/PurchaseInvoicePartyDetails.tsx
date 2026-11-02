"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Building } from "lucide-react";
import { PurchaseInvoiceFormData } from "../types/purchaseInvoice.types";
import { Party } from "../../PurchaseChallan/types/purchaseChallan.types";
import { challanService } from "@/components/Dashboard/OfflineSales/SalesChallan/services/challan.service";
import { extractStateCode } from "../utils/purchaseGstCalculator";

interface PurchaseInvoicePartyDetailsProps {
  formData: PurchaseInvoiceFormData;
  onChange: (fields: Partial<PurchaseInvoiceFormData>) => void;
  disabled?: boolean;
}

export default function PurchaseInvoicePartyDetails({
  formData,
  onChange,
  disabled = false,
}: PurchaseInvoicePartyDetailsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [partyList, setPartyList] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search parties on typing
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

  // Click outside listener
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

  const handleSelectParty = (party: any) => {
    const gstin = party.gstin || "";
    const state = party.state || "Gujarat";
    const stateCode = extractStateCode(gstin, state);
    const pName = party.partyName || "";
    const addr = [party.addressLine1 || party.address1, party.addressLine2 || party.address2].filter(Boolean).join(", ");
    const ph = party.phone || party.whatsapp || "";

    onChange({
      supplierId: party.id,
      partyId: party.id,
      partyGstn: gstin,
      stateCode: stateCode,
      billingPartyName: pName,
      billingAddress: addr,
      billingCity: party.city || "",
      billingState: state,
      billingPincode: party.pincode || "",
      billingEmail: party.email || "",
      billingMobile: ph,
      shippingPartyName: pName,
      shippingAddress: party.shippingAddress1 || addr,
      shippingCity: party.shippingCity || party.city || "",
      shippingState: party.shippingState || state,
      shippingPincode: party.shippingPincode || party.pincode || "",
      shippingContact: party.shippingPhone || ph,
    });

    setDropdownOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] flex flex-col gap-4">
      {/* Title */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        Party Details
      </h3>

      {/* Party Search */}
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            disabled={disabled}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdownOpen(true);
            }}
            placeholder="Search Party..."
            className="w-full h-9 pl-9 pr-8 text-xs text-slate-800 dark:text-white placeholder-slate-400 bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {dropdownOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl divide-y divide-slate-100 dark:divide-white/[0.04]">
            {loading ? (
              <div className="p-3 text-center text-xs text-slate-500">
                Searching parties...
              </div>
            ) : partyList.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No matching parties found
              </div>
            ) : (
              partyList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectParty(p)}
                  className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors flex items-start gap-2.5 text-xs"
                >
                  <Building className="w-4 h-4 text-[#B88728] dark:text-[#F5C451] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {p.partyName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.city ? `${p.city}, ` : ""}{p.state || ""} • GST: {p.gstin || "N/A"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Billing Info Box */}
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#080B11] shadow-xs">
        <div className="bg-[#2B5C8F] px-3.5 py-1.5 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Billing Info.</span>
        </div>
        <div className="p-3 space-y-1.5 text-xs">
          {/* Party Name in red bold font matching legacy UI */}
          <div className="text-sm font-bold text-[#D9534F] dark:text-[#F87171] tracking-tight">
            {formData.billingPartyName || "-"}
          </div>

          {/* Address */}
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Address : </span>
            <span className="text-slate-600 dark:text-slate-400">
              {formData.billingAddress || "-,-"}
            </span>
          </div>

          {/* City */}
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">City : </span>
            <span className="text-slate-600 dark:text-slate-400">
              {formData.billingCity
                ? `${formData.billingCity}${formData.billingState ? `-${formData.billingState}` : ""}`
                : formData.billingState || "-"}
            </span>
          </div>

          {/* Pincode */}
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Pincode : </span>
            <span className="text-slate-600 dark:text-slate-400">
              {formData.billingPincode || "-"}
            </span>
          </div>

          {/* E-Mail ID */}
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">E-Mail ID : </span>
            <span className="text-slate-600 dark:text-slate-400">
              {formData.billingEmail || ""}
            </span>
          </div>

          {/* Mobile No */}
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Mobile No : </span>
            <span className="text-slate-600 dark:text-slate-400">
              {formData.billingMobile || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Info Box */}
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#080B11] shadow-xs">
        <div className="bg-[#2B5C8F] px-3.5 py-1.5 text-white text-xs font-bold uppercase tracking-wider">
          <span>Shipping Info.</span>
        </div>
        <div className="p-3 space-y-2 text-xs">
          {/* Party Name */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              Party Name
            </label>
            <input
              type="text"
              value={formData.shippingPartyName || ""}
              disabled={disabled}
              onChange={(e) => onChange({ shippingPartyName: e.target.value })}
              placeholder="Party Name"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors"
            />
          </div>

          {/* Address */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              Address.
            </label>
            <input
              type="text"
              value={formData.shippingAddress || ""}
              disabled={disabled}
              onChange={(e) => onChange({ shippingAddress: e.target.value })}
              placeholder="-,-"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors"
            />
          </div>

          {/* Shipping Address 2 */}
          <div className="flex items-center gap-2">
            <div className="w-24 shrink-0" />
            <input
              type="text"
              value={formData.shippingAddress2 || ""}
              disabled={disabled}
              onChange={(e) => onChange({ shippingAddress2: e.target.value })}
              placeholder="Shipping Address 2"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* City & State */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              City.
            </label>
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={formData.shippingCity || ""}
                disabled={disabled}
                onChange={(e) => onChange({ shippingCity: e.target.value })}
                placeholder="City"
                className="h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors"
              />
              <input
                type="text"
                value={formData.shippingState || ""}
                disabled={disabled}
                onChange={(e) => onChange({ shippingState: e.target.value })}
                placeholder="State"
                className="h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Pincode */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              Pincode.
            </label>
            <input
              type="text"
              value={formData.shippingPincode || ""}
              disabled={disabled}
              onChange={(e) => onChange({ shippingPincode: e.target.value })}
              placeholder="-"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors"
            />
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              Contact.
            </label>
            <input
              type="text"
              value={formData.shippingContact || ""}
              disabled={disabled}
              onChange={(e) => onChange({ shippingContact: e.target.value })}
              placeholder="-"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors"
            />
          </div>

          {/* Courier Partner */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              Courier Partner.
            </label>
            <input
              type="text"
              value={formData.courierPartner || ""}
              disabled={disabled}
              onChange={(e) => onChange({ courierPartner: e.target.value })}
              placeholder="Courier Partner"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Tracking No */}
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300">
              Tracking No.
            </label>
            <input
              type="text"
              value={formData.trackingNo || ""}
              disabled={disabled}
              onChange={(e) => onChange({ trackingNo: e.target.value })}
              placeholder="Tracking No"
              className="flex-1 h-7.5 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50/50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-md focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none transition-colors placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
