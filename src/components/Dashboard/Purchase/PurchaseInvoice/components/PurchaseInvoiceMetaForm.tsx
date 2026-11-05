"use client";

import React from "react";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { PurchaseInvoiceFormData } from "../types/purchaseInvoice.types";
import { extractStateCode } from "../utils/purchaseGstCalculator";

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "Purchase Voucher", label: "Purchase Voucher" },
];

interface PurchaseInvoiceMetaFormProps {
  formData: PurchaseInvoiceFormData;
  onChange: (fields: Partial<PurchaseInvoiceFormData>) => void;
  disabled?: boolean;
}

export default function PurchaseInvoiceMetaForm({
  formData,
  onChange,
  disabled = false,
}: PurchaseInvoiceMetaFormProps) {
  const handleGstinChange = (gstin: string) => {
    const upper = gstin.toUpperCase().trim();
    const extracted = extractStateCode(upper, formData.billingState);
    onChange({
      partyGstn: upper,
      stateCode: extracted,
    });
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 items-end">
        {/* Invoice Type */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            Invoice Type
          </label>
          <ThemeSelectDropdown
            options={invoiceTypeOptions}
            value={formData.invoiceType || "Tax Invoice"}
            disabled={disabled}
            onChange={(val) => onChange({ invoiceType: val })}
            placeholder="Select Invoice Type"
            className="w-full"
            buttonClassName="w-full h-10 px-3 text-xs sm:text-sm font-semibold rounded-xl justify-between border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
            menuClassName="min-w-[170px]"
          />
        </div>

        {/* OC Invoice No */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            OC Invoice No
          </label>
          <input
            type="text"
            value={formData.invoiceNo}
            readOnly
            tabIndex={-1}
            title="Auto-generated Invoice Number (Non-editable)"
            placeholder="INV No"
            className="w-full h-10 px-3 text-xs sm:text-sm font-bold font-mono text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC]/40 dark:bg-[#1A160E]/50 border border-[#E8C16D]/40 dark:border-[#E8C16D]/30 rounded-xl cursor-not-allowed select-none focus:outline-none"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            Date
          </label>
          <DatePicker
            value={formData.invoiceDate}
            onChange={(_, dateStr) => onChange({ invoiceDate: dateStr || "" })}
            placeholder="DD-MM-YYYY"
            buttonClassName="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
          />
        </div>

        {/* OC Challan No (Editable for direct invoice, linked & read-only when converted from challan) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            OC Challan No
          </label>
          {formData.challanId ? (
            <input
              type="text"
              value={formData.challanNo || ""}
              readOnly
              tabIndex={-1}
              title="Linked Challan Number (Non-editable)"
              placeholder="Challan No"
              className="w-full h-10 px-3 text-xs sm:text-sm font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl cursor-not-allowed select-none focus:outline-none"
            />
          ) : (
            <input
              type="text"
              value={formData.challanNo || ""}
              disabled={disabled}
              onChange={(e) => onChange({ challanNo: e.target.value })}
              placeholder="Challan No"
              className="w-full h-10 px-3 text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 outline-none transition-all"
            />
          )}
        </div>

        {/* Challan Date */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            Challan Date
          </label>
          <DatePicker
            value={formData.challanDate || ""}
            onChange={(_, dateStr) => onChange({ challanDate: dateStr || "" })}
            placeholder="DD-MM-YYYY"
            buttonClassName="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
          />
        </div>

        {/* Party GSTN */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            Party GSTN
          </label>
          <input
            type="text"
            value={formData.partyGstn || ""}
            disabled={disabled}
            onChange={(e) => handleGstinChange(e.target.value)}
            placeholder="24XXXXXXXXXXXXX"
            maxLength={15}
            className="w-full h-10 px-3 text-xs sm:text-sm font-mono uppercase font-semibold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 outline-none transition-all"
          />
        </div>

        {/* State Code */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            State Code
          </label>
          <input
            type="text"
            value={formData.stateCode || ""}
            disabled={disabled}
            onChange={(e) => onChange({ stateCode: e.target.value.slice(0, 2) })}
            placeholder="24"
            maxLength={2}
            className="w-full h-10 px-3 text-xs sm:text-sm font-mono text-center font-bold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 outline-none transition-all"
          />
        </div>

        {/* Broker Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
            Broker Name
          </label>
          <input
            type="text"
            value={formData.brokerName || ""}
            disabled={disabled}
            onChange={(e) => onChange({ brokerName: e.target.value })}
            placeholder="Broker"
            className="w-full h-10 px-3 text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 outline-none transition-all"
          />
        </div>

        {/* Consignee Name + Edit Toggle */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
              Consignee
            </label>
            <button
              type="button"
              onClick={() => onChange({ editOn: !formData.editOn })}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                formData.editOn
                  ? "bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/50 dark:bg-[#1A160E] dark:text-[#E8C16D]"
                  : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
              }`}
            >
              Edit : {formData.editOn ? "ON" : "OFF"}
            </button>
          </div>
          <input
            type="text"
            value={formData.consigneeName || ""}
            disabled={disabled}
            onChange={(e) => onChange({ consigneeName: e.target.value })}
            placeholder="Consignee"
            className="w-full h-10 px-3 text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 outline-none transition-all"
          />
        </div>
      </div>
    </section>
  );
}
