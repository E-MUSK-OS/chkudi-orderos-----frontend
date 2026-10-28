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
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4 items-end">
        {/* Invoice Type */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Invoice Type
          </label>
          <ThemeSelectDropdown
            options={invoiceTypeOptions}
            value={formData.invoiceType || "Tax Invoice"}
            disabled={disabled}
            onChange={(val) => onChange({ invoiceType: val })}
            placeholder="Select Invoice Type"
            className="w-full"
            buttonClassName="w-full h-9 px-2.5 text-xs font-semibold rounded-xl justify-between"
            menuClassName="min-w-[170px]"
          />
        </div>

        {/* OC Invoice No */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            OC Invoice No
          </label>
          <input
            type="text"
            value={formData.invoiceNo}
            readOnly
            tabIndex={-1}
            title="Auto-generated Invoice Number (Non-editable)"
            placeholder="INV No"
            className="w-full h-9 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-[#E9ECEF] dark:bg-[#1A2234] border border-slate-300 dark:border-white/[0.12] rounded-xl cursor-not-allowed select-none focus:outline-none shadow-inner"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Date
          </label>
          <DatePicker
            value={formData.invoiceDate}
            onChange={(_, dateStr) => onChange({ invoiceDate: dateStr || "" })}
            placeholder="DD-MM-YYYY"
            buttonClassName="h-9 text-xs"
          />
        </div>

        {/* OC Challan No */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            OC Challan No
          </label>
          <input
            type="text"
            value={formData.challanNo || ""}
            readOnly
            tabIndex={-1}
            title="Linked Challan Number (Non-editable)"
            placeholder="Challan No"
            className="w-full h-9 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-[#E9ECEF] dark:bg-[#1A2234] border border-slate-300 dark:border-white/[0.12] rounded-xl cursor-not-allowed select-none focus:outline-none shadow-inner"
          />
        </div>

        {/* Challan Date */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Challan Date
          </label>
          <DatePicker
            value={formData.challanDate || ""}
            onChange={(_, dateStr) => onChange({ challanDate: dateStr || "" })}
            placeholder="DD-MM-YYYY"
            buttonClassName="h-9 text-xs"
          />
        </div>

        {/* Party GSTN */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Party GSTN
          </label>
          <input
            type="text"
            value={formData.partyGstn || ""}
            disabled={disabled}
            onChange={(e) => handleGstinChange(e.target.value)}
            placeholder="24XXXXXXXXXXXXX"
            maxLength={15}
            className="w-full h-9 px-2.5 text-xs font-mono uppercase text-slate-800 dark:text-white bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* State Code */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            State Code
          </label>
          <input
            type="text"
            value={formData.stateCode || "24"}
            disabled={disabled}
            onChange={(e) => onChange({ stateCode: e.target.value.slice(0, 2) })}
            placeholder="24"
            maxLength={2}
            className="w-full h-9 px-2.5 text-xs font-mono text-center font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Broker Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Broker Name
          </label>
          <input
            type="text"
            value={formData.brokerName || ""}
            disabled={disabled}
            onChange={(e) => onChange({ brokerName: e.target.value })}
            placeholder="Broker"
            className="w-full h-9 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Consignee Name + Edit Toggle */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Consignee
            </label>
            <button
              type="button"
              onClick={() => onChange({ editOn: !formData.editOn })}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${
                formData.editOn
                  ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                  : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
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
            className="w-full h-9 px-2.5 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
          />
        </div>
      </div>
    </section>
  );
}
