"use client";

import React from "react";
import { SalesInvoiceItem } from "../types/salesInvoice.types";

interface InvoiceItemsTableProps {
  items: SalesInvoiceItem[];
  onChange: (items: SalesInvoiceItem[]) => void;
  partyStateCode: string;
  disabled?: boolean;
}

function cleanDisplay(val: any): string | number {
  if (val === 0 || val === "0" || val === "" || val === undefined || val === null) {
    return "";
  }
  return val;
}

export default function InvoiceItemsTable({
  items,
  onChange,
  partyStateCode,
  disabled = false,
}: InvoiceItemsTableProps) {
  // Update a single field in an item row with intelligent cascading calculations
  const handleItemFieldChange = (
    index: number,
    field: keyof SalesInvoiceItem,
    rawVal: string
  ) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === "particular" || field === "sku" || field === "hsn") {
      (current as any)[field] = rawVal;
    } else {
      // Allow user to completely clear the field to empty string
      if (rawVal === "" || rawVal === null || rawVal === undefined) {
        (current as any)[field] = "";
      } else {
        const num = parseFloat(rawVal);
        (current as any)[field] = isNaN(num) ? "" : num;
      }

      const qty = current.quantity === "" ? 0 : Number(current.quantity) || 0;
      let rate = current.rate === "" ? 0 : Number(current.rate) || 0;
      let amount = current.amount === "" ? 0 : Number(current.amount) || 0;

      // Quantity or Rate changed -> compute Amount
      if (field === "quantity" || field === "rate") {
        amount = Math.round(qty * rate * 100) / 100;
        current.amount = amount === 0 ? "" : amount;
      } else if (field === "amount") {
        if (rawVal !== "") {
          amount = parseFloat(rawVal) || 0;
          rate = qty > 0 ? Math.round((amount / qty) * 100) / 100 : 0;
          current.rate = rate === 0 ? "" : rate;
        }
      }

      // Discount calculations
      let disPct = current.discountPercent === "" ? 0 : Number(current.discountPercent) || 0;
      let disAmt = current.discountAmount === "" ? 0 : Number(current.discountAmount) || 0;

      if (field === "discountPercent") {
        if (rawVal !== "") {
          disPct = parseFloat(rawVal) || 0;
          disAmt = Math.round(amount * (disPct / 100) * 100) / 100;
          current.discountAmount = disAmt === 0 ? "" : disAmt;
        }
      } else if (field === "discountAmount") {
        if (rawVal !== "") {
          disAmt = parseFloat(rawVal) || 0;
          disPct = amount > 0 ? Math.round((disAmt / amount) * 10000) / 100 : 0;
          current.discountPercent = disPct === 0 ? "" : disPct;
        }
      } else if (field === "quantity" || field === "rate" || field === "amount") {
        if (disPct > 0) {
          disAmt = Math.round(amount * (disPct / 100) * 100) / 100;
          current.discountAmount = disAmt === 0 ? "" : disAmt;
        }
      }

      // Taxable amount
      let taxableAmt =
        field === "taxableAmount" && rawVal !== ""
          ? parseFloat(rawVal) || 0
          : Math.round(Math.max(0, amount - disAmt) * 100) / 100;
      current.taxableAmount = taxableAmt === 0 ? "" : taxableAmt;

      // GST Rates & Amounts
      let sgstRate = current.sgstRate === "" ? 0 : Number(current.sgstRate) || 0;
      let sgstAmt = current.sgstAmount === "" ? 0 : Number(current.sgstAmount) || 0;
      let cgstRate = current.cgstRate === "" ? 0 : Number(current.cgstRate) || 0;
      let cgstAmt = current.cgstAmount === "" ? 0 : Number(current.cgstAmount) || 0;
      let igstRate = current.igstRate === "" ? 0 : Number(current.igstRate) || 0;
      let igstAmt = current.igstAmount === "" ? 0 : Number(current.igstAmount) || 0;

      if (field === "sgstRate") {
        sgstRate = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
        sgstAmt = Math.round(taxableAmt * (sgstRate / 100) * 100) / 100;
        current.sgstAmount = sgstAmt === 0 ? "" : sgstAmt;
      } else if (field === "sgstAmount") {
        sgstAmt = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
      } else if (sgstRate > 0) {
        sgstAmt = Math.round(taxableAmt * (sgstRate / 100) * 100) / 100;
        current.sgstAmount = sgstAmt === 0 ? "" : sgstAmt;
      }

      if (field === "cgstRate") {
        cgstRate = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
        cgstAmt = Math.round(taxableAmt * (cgstRate / 100) * 100) / 100;
        current.cgstAmount = cgstAmt === 0 ? "" : cgstAmt;
      } else if (field === "cgstAmount") {
        cgstAmt = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
      } else if (cgstRate > 0) {
        cgstAmt = Math.round(taxableAmt * (cgstRate / 100) * 100) / 100;
        current.cgstAmount = cgstAmt === 0 ? "" : cgstAmt;
      }

      if (field === "igstRate") {
        igstRate = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
        igstAmt = Math.round(taxableAmt * (igstRate / 100) * 100) / 100;
        current.igstAmount = igstAmt === 0 ? "" : igstAmt;
      } else if (field === "igstAmount") {
        igstAmt = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
      } else if (igstRate > 0) {
        igstAmt = Math.round(taxableAmt * (igstRate / 100) * 100) / 100;
        current.igstAmount = igstAmt === 0 ? "" : igstAmt;
      }

      // Total calculation
      if (field === "total") {
        current.total = rawVal === "" ? "" : parseFloat(rawVal) || 0;
      } else {
        const lineTotal = Math.round((taxableAmt + sgstAmt + cgstAmt + igstAmt) * 100) / 100;
        current.total = lineTotal === 0 ? "" : lineTotal;
      }
    }

    updated[index] = {
      ...current,
      itemNo: index + 1,
    };

    onChange(updated);
  };

  // Total quantity
  const totalQty =
    Math.round(
      items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) * 1000
    ) / 1000;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white overflow-hidden shadow-xs dark:bg-[#0F1626]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#080B11] border-b border-slate-800 dark:border-white/[0.08]">
              <th className="py-3 px-2 text-center w-10 font-bold uppercase tracking-wider">No.</th>
              <th className="py-3 px-2.5 min-w-[190px] font-bold uppercase tracking-wider">Particular</th>
              <th className="py-3 px-1.5 text-center w-24 font-bold uppercase tracking-wider">HSN</th>
              <th className="py-3 px-1.5 text-right w-16 font-bold uppercase tracking-wider">Qty</th>
              <th className="py-3 px-1.5 text-right w-20 font-bold uppercase tracking-wider">Rate</th>
              <th className="py-3 px-1.5 text-right w-24 font-bold uppercase tracking-wider">Amount</th>
              <th className="py-3 px-1.5 text-right w-16 font-bold uppercase tracking-wider">Dis %</th>
              <th className="py-3 px-1.5 text-right w-20 font-bold uppercase tracking-wider">Discount</th>
              <th className="py-3 px-1.5 text-right w-24 font-bold uppercase tracking-wider">Taxable Amt</th>
              <th className="py-3 px-1 text-center w-14 font-bold uppercase tracking-wider">SGST Rate</th>
              <th className="py-3 px-1.5 text-right w-20 font-bold uppercase tracking-wider">SGST Amt</th>
              <th className="py-3 px-1 text-center w-14 font-bold uppercase tracking-wider">CGST Rate</th>
              <th className="py-3 px-1.5 text-right w-20 font-bold uppercase tracking-wider">CGST Amt</th>
              <th className="py-3 px-1 text-center w-14 font-bold uppercase tracking-wider">IGST Rate</th>
              <th className="py-3 px-1.5 text-right w-20 font-bold uppercase tracking-wider">IGST Amt</th>
              <th className="py-3 px-2 text-right w-28 font-bold uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {items.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* No. */}
                <td className="py-1.5 px-2 text-center text-slate-500 font-mono font-bold dark:text-slate-400">
                  {item.itemNo || index + 1}
                </td>

                {/* Particular */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="text"
                    value={item.particular || item.sku || ""}
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "particular", e.target.value)
                    }
                    placeholder="Particular / SKU"
                    className="w-full h-8 px-2 text-xs font-mono font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* HSN */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="text"
                    value={item.hsn || ""}
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "hsn", e.target.value)
                    }
                    placeholder="HSN"
                    className="w-full h-8 px-1.5 text-xs text-center font-mono text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Qty */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.quantity)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "quantity", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Rate */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.rate)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "rate", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Amount */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.amount)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "amount", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-mono font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Dis % */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.discountPercent)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "discountPercent", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Discount */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.discountAmount)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "discountAmount", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-mono text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Taxable Amount */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.taxableAmount)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "taxableAmount", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-mono font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* SGST Rate */}
                <td className="py-1.5 px-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.sgstRate)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "sgstRate", e.target.value)
                    }
                    className="w-full h-8 px-1 text-xs text-center font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* SGST Amount */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.sgstAmount)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "sgstAmount", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-mono text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* CGST Rate */}
                <td className="py-1.5 px-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.cgstRate)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "cgstRate", e.target.value)
                    }
                    className="w-full h-8 px-1 text-xs text-center font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* CGST Amount */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.cgstAmount)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "cgstAmount", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-mono text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* IGST Rate */}
                <td className="py-1.5 px-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.igstRate)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "igstRate", e.target.value)
                    }
                    className="w-full h-8 px-1 text-xs text-center font-medium text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* IGST Amount */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.igstAmount)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "igstAmount", e.target.value)
                    }
                    className="w-full h-8 px-1.5 text-xs text-right font-mono text-slate-800 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>

                {/* Total */}
                <td className="py-1.5 px-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cleanDisplay(item.total)}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={(e) =>
                      handleItemFieldChange(index, "total", e.target.value)
                    }
                    className="w-full h-8 px-2 text-xs text-right font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] rounded-lg focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#FFF9EC] dark:bg-[#1A160E] border-t border-[#E8C16D]/40 font-bold">
              <td
                colSpan={3}
                className="py-3 px-3 text-right text-xs uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]"
              >
                Total Qty
              </td>
              <td className="py-3 px-1.5 text-right font-mono text-xs font-bold text-[#0A0E1A] dark:text-white">
                {totalQty}
              </td>
              <td colSpan={12} className="py-3 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
