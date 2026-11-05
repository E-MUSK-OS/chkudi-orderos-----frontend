"use client";

import React, { useEffect } from "react";
import {
  FileText,
  Printer,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Package,
  X,
} from "lucide-react";
import { PurchaseChallan } from "../Purchase/PurchaseChallan/types/purchaseChallan.types";
import { SalesChallan } from "../OfflineSales/SalesChallan/types/challan.types";

export type ChallanViewType = "Purchase" | "Sales";

export interface ViewChallanModalProps {
  open: boolean;
  type: ChallanViewType;
  challan: (PurchaseChallan | SalesChallan) | null;
  loading?: boolean;
  onClose: () => void;
  onEdit?: (challan: any) => void;
}

export default function ViewChallanModal({
  open,
  type,
  challan,
  loading = false,
  onClose,
  onEdit,
}: ViewChallanModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !challan) return null;

  const isPurchase = type === "Purchase";
  const purchase = isPurchase ? (challan as PurchaseChallan) : null;
  const sales = !isPurchase ? (challan as SalesChallan) : null;

  const isPending = challan.invoiceStatus?.toLowerCase() === "pending";

  // Unified Party details
  const partyName = isPurchase ? purchase?.supplierName : sales?.partyName;
  const partyContact = challan.contactNo;
  const partyLocation = isPurchase
    ? purchase?.supplier
      ? `${purchase.supplier.city || ""}${purchase.supplier.state ? `, ${purchase.supplier.state}` : ""}`.trim()
      : ""
    : sales?.party
    ? `${sales.party.city || ""}${sales.party.state ? `, ${sales.party.state}` : ""}`.trim()
    : "";
  const partyGstin = isPurchase ? purchase?.supplier?.gstin : sales?.party?.gstin;

  // Unified Reference & Warehouse
  const refLabel = isPurchase ? "Party Challan No:" : "Ref No:";
  const refValue = isPurchase ? purchase?.partyChallanNo || "-" : sales?.challanRefNo || "-";
  const warehouseLabel = isPurchase ? "Stock In Warehouse:" : "Stock Out Warehouse:";
  const warehouseValue = isPurchase ? purchase?.stockIn : sales?.stockOutFrom;

  // Unified Quantity
  const totalQty = isPurchase ? purchase?.totalReceivedQty : sales?.totalQuantity;
  const qtyLabel = isPurchase ? "Total Received Qty:" : "Total Dispatched Qty:";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-5xl rounded-[28px] sm:rounded-[32px] overflow-hidden border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0A0E1A] shadow-2xl relative my-auto flex flex-col max-h-[92vh] transition-all">
        {/* Top Header - Dark Obsidian Banner from Screenshot */}
        <div className="bg-[#0A0E1A] dark:bg-[#080B11] border-b border-slate-800 dark:border-white/[0.08] px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 dark:border-white/10 text-[#E8C16D] bg-white/[0.04] shrink-0">
              <FileText className="w-5 h-5 text-[#E8C16D]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {isPurchase ? "Purchase Challan" : "Sales Challan"}
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1A160E] text-[#E8C16D] border border-[#E8C16D]/60 shadow-2xs">
                  {challan.challanNo}
                </span>
                {isPending ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#1A160E] text-[#E8C16D] border border-[#E8C16D]/40 shadow-2xs">
                    <Clock className="h-3 w-3" />
                    Pending Invoicing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-400/50 shadow-2xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Invoiced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-normal mt-1">
                {isPurchase
                  ? "Inward Purchase Delivery Note • Goods Receipt Document"
                  : "Offline Sales Delivery Note • Outward Goods Dispatch"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] text-slate-400 font-medium">
                Challan Date
              </p>
              <p className="text-sm sm:text-base font-bold text-white leading-tight">
                {new Date(challan.challanDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-[#FAF8F5]/60 dark:bg-[#0A0E1A]">
          {/* 3 Overview Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Party / Supplier Card */}
            <div className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E8C16D]/50 dark:border-[#E8C16D]/30 space-y-3 shadow-xs hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/70 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                <Building2 className="h-3.5 w-3.5" />
                <span>{isPurchase ? "SUPPLIER / PARTY" : "PARTY / BUYER"}</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {partyName || "-"}
                </p>
                {partyContact && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contact:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {partyContact}
                    </span>
                  </p>
                )}
                {partyLocation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Location:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {partyLocation}
                    </span>
                  </p>
                )}
                {partyGstin && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    GSTIN:{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {partyGstin}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Challan Info Card */}
            <div className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E8C16D]/50 dark:border-[#E8C16D]/30 space-y-3 shadow-xs hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/70 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                <Calendar className="h-3.5 w-3.5" />
                <span>CHALLAN INFO</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{refLabel}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {refValue}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Category / For:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {challan.challanFor}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{warehouseLabel}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {warehouseValue}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatch & Staff Card */}
            <div className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E8C16D]/50 dark:border-[#E8C16D]/30 space-y-3 shadow-xs hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/70 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                <User className="h-3.5 w-3.5" />
                <span>DISPATCH & STAFF</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Prepared By:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {challan.preparedBy || "Ramesh"}
                  </span>
                </div>

                {isPurchase ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Checked / Received:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {purchase?.checkedBy || purchase?.receivedBy || "Ramesh"}
                      </span>
                    </div>
                    {purchase?.courierPartner && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Courier:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {purchase.courierPartner}
                        </span>
                      </div>
                    )}
                    {purchase?.lrNo && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          LR / Track No:
                        </span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {purchase.lrNo}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Delivery By:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sales?.deliveryBy || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Consignee:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sales?.consigneeName || "Not Applicable"}
                      </span>
                    </div>
                    {sales?.deliveryTerms && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Terms:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {sales.deliveryTerms}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Items & Particulars ({challan.items?.length || 0})</span>
              </h3>
            </div>

            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/30 bg-white dark:bg-[#0F1626] shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0A0E1A] dark:bg-[#080B11] border-b border-slate-800 dark:border-white/[0.08] text-white">
                    <tr>
                      <th className="px-4 py-3 text-center w-12 font-bold uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">
                        Particulars SKU
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">
                        Particulars Name
                      </th>
                      {isPurchase && (
                        <>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider">
                            Party Challan No
                          </th>
                          <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">
                            Ordered
                          </th>
                          <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">
                            Received
                          </th>
                        </>
                      )}
                      {!isPurchase && (
                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">
                          Dispatched Qty
                        </th>
                      )}
                      <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">
                        Rate (₹)
                      </th>
                      <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {challan.items && challan.items.length > 0 ? (
                      challan.items.map((item: any, idx: number) => {
                        const itemQty = isPurchase ? item.receivedQty : item.quantity;
                        const itemAmt =
                          item.amount !== undefined && item.amount !== null
                            ? item.amount
                            : (Number(itemQty) || 0) * (Number(item.rate) || 0);

                        const isEven = idx % 2 === 1;

                        return (
                          <tr
                            key={item.id || idx}
                            className={`transition-colors hover:bg-[#FFF9EC]/70 dark:hover:bg-white/[0.04] ${
                              isEven
                                ? "bg-[#FFF9EC]/35 dark:bg-white/[0.015]"
                                : "bg-white dark:bg-[#0F1626]"
                            }`}
                          >
                            <td className="px-4 py-3 text-center text-slate-400 font-mono">
                              {item.itemNo || idx + 1}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                              {item.sku}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                              {item.name || "-"}
                            </td>

                            {isPurchase && (
                              <>
                                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                                  {item.partyChallanNo || "-"}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300 font-semibold">
                                  {item.orderedQty || 0}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-3.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/50 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                                    {item.receivedQty}
                                  </span>
                                </td>
                              </>
                            )}

                            {!isPurchase && (
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center min-w-[28px] px-3.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/50 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                                  {item.quantity}
                                </span>
                              </td>
                            )}

                            <td className="px-4 py-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                              ₹{(Number(item.rate) || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ₹{itemAmt.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={isPurchase ? 8 : 6}
                          className="py-8 text-center text-slate-400 font-medium"
                        >
                          No items found in this challan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Footer Bar */}
              <div className="bg-[#FFF9EC] dark:bg-[#1A160E] border-t border-[#E8C16D]/40 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-5 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Total Items: </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {challan.items?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">{qtyLabel} </span>
                    <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">
                      {totalQty} units
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {isPurchase ? "Total Inward Value:" : "Total Dispatch Value:"}
                  </span>
                  <span className="px-3.5 py-1 rounded-xl bg-[#E8C16D] text-[#0A0E1A] font-bold font-mono text-sm sm:text-base shadow-xs">
                    ₹{(challan.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-7 py-4 bg-white dark:bg-[#0A0E1A] border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Created: {new Date(challan.createdAt).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-5 text-xs font-bold rounded-full border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[#0A0E1A] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(challan);
                }}
                className="h-10 px-6 bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] rounded-full font-bold text-xs shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Edit Challan
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-10 px-6 text-xs font-bold rounded-full border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[#0A0E1A] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
