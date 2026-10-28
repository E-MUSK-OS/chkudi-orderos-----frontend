"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Play } from "lucide-react";
import { PurchaseInvoiceFormData } from "../types/purchaseInvoice.types";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { webstoreService } from "@/components/Dashboard/Settings/Webstore/services/webstore.service";

interface PurchaseInvoiceSummaryFooterProps {
  formData: PurchaseInvoiceFormData;
  onChange: (fields: Partial<PurchaseInvoiceFormData>) => void;
  computedTotals: {
    totalQuantity: number;
    totalAmount: number;
    totalDiscount: number;
    amountBeforeTax: number;
    sgstAmount: number;
    cgstAmount: number;
    igstAmount: number;
    totalGst: number;
    amountAfterTax: number;
    roundOff: number;
    netAmount: number;
  };
  disabled?: boolean;
}

function cleanDisplay(val: any): string | number {
  if (val === 0 || val === "0" || val === "" || val === undefined || val === null) {
    return "";
  }
  return Number(val).toFixed(2);
}

function getTodayFormatted(): string {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  return `${d}-${m}-${y}`;
}

const receiptModeOptions: ThemeSelectOption[] = [
  { value: "Select Mode", label: "Select Mode" },
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
];

const cashAccountOptions: ThemeSelectOption[] = [
  { value: "Cash-Rameshbhai", label: "Cash-Rameshbhai" },
  { value: "CASH-WDL", label: "CASH-WDL" },
];

const defaultBankAccountOptions: ThemeSelectOption[] = [
  { value: "BOI Saving A/C 7199", label: "BOI Saving A/C 7199" },
];

const transactionTypeOptions: ThemeSelectOption[] = [
  { value: "Cheque", label: "Cheque" },
  { value: "RTGS", label: "RTGS" },
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "Debit/Credit Card", label: "Debit/Credit Card" },
  { value: "Paytm", label: "Paytm" },
  { value: "Bhim", label: "Bhim" },
  { value: "GooglePay", label: "GooglePay" },
  { value: "PhonePe", label: "PhonePe" },
  { value: "Tej", label: "Tej" },
  { value: "Cash", label: "Cash" },
];

function getTransactionRefLabel(type?: string | null): string {
  if (!type || type === "Cheque") return "Cheque No";
  if (type === "Debit/Credit Card") return "Card No";
  return `${type} No`;
}

export default function PurchaseInvoiceSummaryFooter({
  formData,
  onChange,
  computedTotals,
  disabled = false,
}: PurchaseInvoiceSummaryFooterProps) {
  const [bankAccounts, setBankAccounts] = useState<ThemeSelectOption[]>(defaultBankAccountOptions);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await webstoreService.getWebstores({ isActive: "All" });
        if (res?.data && isMounted) {
          const accounts = new Set<string>();
          accounts.add("BOI Saving A/C 7199");
          res.data.forEach((ws) => {
            if (ws.bankAccount && ws.bankAccount.trim()) {
              accounts.add(ws.bankAccount.trim());
            }
          });
          setBankAccounts(
            Array.from(accounts).map((acc) => ({ value: acc, label: acc }))
          );
        }
      } catch (err) {
        // Fallback to default
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const accountOptions = useMemo(() => {
    if (formData.receiptMode === "Cash") {
      return cashAccountOptions;
    }
    if (formData.receiptMode === "Bank") {
      return bankAccounts;
    }
    return [{ value: "", label: "Select Account" }];
  }, [formData.receiptMode, bankAccounts]);

  const handleToggleReceipt = () => {
    if (disabled) return;
    const nextState = !formData.hasReceipt;
    if (nextState) {
      onChange({
        hasReceipt: true,
        receivedAmount:
          formData.receivedAmount !== undefined && formData.receivedAmount !== null
            ? formData.receivedAmount
            : 0,
        receiptMode: formData.receiptMode || "Select Mode",
        receiptAccount: formData.receiptAccount || "",
        transactionType: formData.transactionType || "Cheque",
        transactionDate: formData.transactionDate || formData.invoiceDate || getTodayFormatted(),
        chequeNo: formData.chequeNo || "",
        bankName: formData.bankName || "",
      });
    } else {
      onChange({ hasReceipt: false });
    }
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Remarks, Eway Bill, Expense On Purchase, Receipt toggle */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Remarks
            </label>
            <textarea
              rows={2}
              value={formData.remarks || ""}
              disabled={disabled}
              onChange={(e) => onChange({ remarks: e.target.value })}
              placeholder="Add any remarks or delivery terms..."
              className="w-full p-2.5 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Eway Bill No */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Eway Bill No.
            </label>
            <input
              type="text"
              value={formData.ewayBillNo || ""}
              disabled={disabled}
              onChange={(e) => onChange({ ewayBillNo: e.target.value })}
              placeholder="Enter E-Way Bill Number"
              className="w-full h-9 px-2.5 text-xs font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Expense On Purchase & Receipt Toggle */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            {/* Expense on purchase */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expense on Purchase
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-white/[0.08]"
              >
                <span>Select ({cleanDisplay(formData.expenseOnPurchase) || "0"})</span>
                <Play className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              </button>
            </div>

            {/* Receipt toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Receipt
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={handleToggleReceipt}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.hasReceipt ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.hasReceipt ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-[11px] font-bold text-slate-500">
                {formData.hasReceipt ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Statutory GST Calculations & Summary matching Image 1 */}
        <div className="lg:col-span-7 space-y-2.5 bg-slate-50/70 dark:bg-[#080B11]/50 p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
          {/* Total Amount */}
          <div className="flex items-center justify-between text-xs gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Total Amount</span>
            <input
              type="text"
              value={cleanDisplay(computedTotals.totalAmount)}
              placeholder="0.00"
              readOnly
              className="w-36 h-8 px-2 text-right font-mono text-xs text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between text-xs gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Discount</span>
            <input
              type="text"
              value={cleanDisplay(computedTotals.totalDiscount)}
              placeholder="0.00"
              readOnly
              className="w-36 h-8 px-2 text-right font-mono text-xs text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Total Amount Before Tax */}
          <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-white/[0.06] pt-2 gap-4">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Total Amount Before Tax
            </span>
            <input
              type="text"
              value={cleanDisplay(computedTotals.amountBeforeTax)}
              placeholder="0.00"
              readOnly
              className="w-36 h-8 px-2 text-right font-mono font-bold text-xs text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* GST breakdown row */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Add : SGST</span>
              <input
                type="text"
                value={cleanDisplay(computedTotals.sgstAmount)}
                placeholder="0.00"
                readOnly
                className="w-24 h-8 px-1.5 text-right font-mono text-xs text-teal-600 dark:text-teal-400 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">CGST</span>
              <input
                type="text"
                value={cleanDisplay(computedTotals.cgstAmount)}
                placeholder="0.00"
                readOnly
                className="w-24 h-8 px-1.5 text-right font-mono text-xs text-teal-600 dark:text-teal-400 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">IGST</span>
              <input
                type="text"
                value={cleanDisplay(computedTotals.igstAmount)}
                placeholder="0.00"
                readOnly
                className="w-24 h-8 px-1.5 text-right font-mono text-xs text-teal-600 dark:text-teal-400 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">Total GST</span>
              <input
                type="text"
                value={cleanDisplay(computedTotals.totalGst)}
                placeholder="0.00"
                readOnly
                className="w-24 h-8 px-1.5 text-right font-mono font-bold text-xs text-teal-700 dark:text-teal-300 bg-white dark:bg-[#080B11] border border-teal-500/30 rounded-lg focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Total Amount After Tax */}
          <div className="flex items-center justify-between text-xs gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total Amount After Tax
            </span>
            <input
              type="text"
              value={cleanDisplay(computedTotals.amountAfterTax)}
              placeholder="0.00"
              readOnly
              className="w-36 h-8 px-2 text-right font-mono text-xs text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Round Off */}
          <div className="flex items-center justify-between text-xs gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-slate-600 dark:text-slate-400">
              <input
                id="roundOffCheckbox"
                name="applyRoundOff"
                type="checkbox"
                checked={formData.applyRoundOff !== false}
                disabled={disabled}
                onChange={(e) => onChange({ applyRoundOff: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span>Round Off(%)</span>
            </label>
            <input
              type="text"
              value={cleanDisplay(computedTotals.roundOff)}
              placeholder="0.00"
              readOnly
              className="w-36 h-8 px-2 text-right font-mono text-xs text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Net Amount - Highlight Box with Input */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-600/10 dark:bg-teal-500/15 border border-teal-600/30 dark:border-teal-500/30 shadow-sm mt-2">
            <span className="text-sm font-black uppercase tracking-wider text-teal-800 dark:text-teal-200">
              Net Amount
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-lg font-bold text-teal-700 dark:text-teal-300">₹</span>
              <input
                type="text"
                value={cleanDisplay(computedTotals.netAmount)}
                placeholder="0.00"
                readOnly
                className="w-44 h-10 px-3 text-right font-mono text-lg font-black text-teal-900 dark:text-white bg-white dark:bg-[#0F1626] border border-teal-500/40 rounded-xl focus:outline-none shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Panel Section (Rendered when Receipt is ON) */}
      {formData.hasReceipt && (
        <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
          {/* Receipt Panel Details Box */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#080B11]/60 border border-slate-200/80 dark:border-white/[0.08]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Received Amount, Receipt Mode, Account */}
              <div
                className={`space-y-3.5 ${
                  formData.receiptMode === "Bank" ? "lg:col-span-5" : "lg:col-span-7"
                }`}
              >
                {/* Received Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Received Amount
                  </label>
                  <div className="relative max-w-xs sm:max-w-[240px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      disabled={disabled}
                      value={
                        formData.receivedAmount === 0
                          ? 0
                          : (formData.receivedAmount ?? 0)
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange({ receivedAmount: val === "" ? 0 : Number(val) });
                      }}
                      placeholder="0"
                      className="w-full h-8 pl-6 pr-2.5 text-right font-mono text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Receipt Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Receipt Mode
                  </label>
                  <div className="max-w-xs sm:max-w-[240px]">
                    <ThemeSelectDropdown
                      options={receiptModeOptions}
                      value={formData.receiptMode || "Select Mode"}
                      disabled={disabled}
                      onChange={(val) => {
                        let defaultAccount = "";
                        if (val === "Cash") {
                          defaultAccount = "Cash-Rameshbhai";
                        } else if (val === "Bank") {
                          defaultAccount = bankAccounts[0]?.value || "BOI Saving A/C 7199";
                        }
                        onChange({
                          receiptMode: val,
                          receiptAccount: defaultAccount,
                          ...(val === "Bank" && !formData.transactionType
                            ? { transactionType: "Cheque" }
                            : {}),
                          ...(val === "Bank" && !formData.transactionDate
                            ? { transactionDate: formData.invoiceDate || getTodayFormatted() }
                            : {}),
                        });
                      }}
                      placeholder="Select Mode"
                      className="w-full"
                      buttonClassName="w-full h-8 px-2.5 text-xs font-semibold rounded-xl justify-between"
                      menuClassName="min-w-[200px]"
                    />
                  </div>
                </div>

                {/* Account */}
                <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Account
                  </label>
                  <div className="max-w-xs sm:max-w-[240px]">
                    <ThemeSelectDropdown
                      options={accountOptions}
                      value={
                        formData.receiptAccount ||
                        (formData.receiptMode === "Cash"
                          ? "Cash-Rameshbhai"
                          : formData.receiptMode === "Bank"
                          ? bankAccounts[0]?.value || "BOI Saving A/C 7199"
                          : "")
                      }
                      disabled={
                        disabled || !formData.receiptMode || formData.receiptMode === "Select Mode"
                      }
                      onChange={(val) => onChange({ receiptAccount: val })}
                      placeholder="Select Account"
                      className="w-full"
                      buttonClassName="w-full h-8 px-2.5 text-xs font-semibold rounded-xl justify-between"
                      menuClassName="min-w-[220px]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Transaction Details (visible ONLY when Receipt Mode is Bank) */}
              {formData.receiptMode === "Bank" && (
                <div className="lg:col-span-7 pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/[0.08] space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">
                    Transaction Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Type */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Type
                      </label>
                      <ThemeSelectDropdown
                        options={transactionTypeOptions}
                        value={formData.transactionType || "Cheque"}
                        disabled={disabled}
                        onChange={(val) => onChange({ transactionType: val })}
                        placeholder="Select Type"
                        className="w-full"
                        buttonClassName="w-full h-8 px-2.5 text-xs font-semibold rounded-xl justify-between"
                        menuClassName="min-w-[170px]"
                      />
                    </div>

                    {/* Date */}
                    <div className="grid grid-cols-[70px_1fr] items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Date
                      </label>
                      <DatePicker
                        value={
                          formData.transactionDate || formData.invoiceDate || getTodayFormatted()
                        }
                        onChange={(_, dateStr) => onChange({ transactionDate: dateStr || "" })}
                        placeholder="DD-MM-YYYY"
                        buttonClassName="h-8 text-xs w-full"
                        disabled={disabled}
                      />
                    </div>

                    {/* Dynamic Reference No (Cheque No / RTGS No / NEFT No / IMPS No etc.) */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                      <label
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate"
                        title={getTransactionRefLabel(formData.transactionType)}
                      >
                        {getTransactionRefLabel(formData.transactionType)}
                      </label>
                      <input
                        type="text"
                        value={formData.chequeNo || ""}
                        disabled={disabled}
                        onChange={(e) => onChange({ chequeNo: e.target.value })}
                        placeholder={getTransactionRefLabel(formData.transactionType)}
                        className="w-full h-8 px-2.5 text-xs font-mono text-slate-800 dark:text-white bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Bank Name */}
                    <div className="grid grid-cols-[70px_1fr] items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankName || ""}
                        disabled={disabled}
                        onChange={(e) => onChange({ bankName: e.target.value })}
                        placeholder="Bank Name"
                        className="w-full h-8 px-2.5 text-xs text-slate-800 dark:text-white bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
