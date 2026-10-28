"use client";

import React from "react";
import {
  FileText,
  Printer,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
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
  if (!challan) return null;

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

  const footer = (
    <div className="flex items-center justify-between w-full px-2">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Created: {new Date(challan.createdAt).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          fullWidth={false}
          onClick={handlePrint}
          className="rounded-xl h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print</span>
        </Button>
        {onEdit && (
          <Button
            variant="primary"
            fullWidth={false}
            onClick={() => {
              onClose();
              onEdit(challan);
            }}
            className="rounded-xl h-9 px-4 text-xs font-bold"
          >
            Edit Challan
          </Button>
        )}
        <Button
          variant="secondary"
          fullWidth={false}
          onClick={onClose}
          className="rounded-xl h-9 px-4 text-xs font-semibold"
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      showHeader={false}
      footer={footer}
    >
      <div className="p-5 sm:p-7 space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isPurchase ? "Purchase Challan" : "Sales Challan"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                  {challan.challanNo}
                </span>
                {isPending ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    <Clock className="h-3 w-3" />
                    Pending Invoicing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-3 w-3" />
                    Invoiced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isPurchase
                  ? "Inward Purchase Delivery Note • Goods Receipt Document"
                  : "Offline Sales Delivery Note • Outward Goods Dispatch"}
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Challan Date
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {new Date(challan.challanDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* 3 Overview Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Party / Supplier Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B88728] dark:text-[#E8C16D]">
              <Building2 className="h-3.5 w-3.5" />
              <span>{isPurchase ? "SUPPLIER / PARTY" : "PARTY / BUYER"}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {partyName || "-"}
              </p>
              {partyContact && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Contact: <span className="font-medium text-slate-700 dark:text-slate-300">{partyContact}</span>
                </p>
              )}
              {partyLocation && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Location: {partyLocation}
                </p>
              )}
              {partyGstin && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  GSTIN: {partyGstin}
                </p>
              )}
            </div>
          </div>

          {/* Challan Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B88728] dark:text-[#E8C16D]">
              <Calendar className="h-3.5 w-3.5" />
              <span>CHALLAN INFO</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{refLabel}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {refValue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Category / For:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {challan.challanFor}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{warehouseLabel}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {warehouseValue}
                </span>
              </div>
            </div>
          </div>

          {/* Staff & Logistics Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B88728] dark:text-[#E8C16D]">
              <User className="h-3.5 w-3.5" />
              <span>DISPATCH & STAFF</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Prepared By:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {challan.preparedBy || "Ramesh"}
                </span>
              </div>

              {isPurchase ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Checked / Received:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {purchase?.checkedBy || purchase?.receivedBy || "Ramesh"}
                    </span>
                  </div>
                  {purchase?.courierPartner && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Courier:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {purchase.courierPartner}
                      </span>
                    </div>
                  )}
                  {purchase?.lrNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">LR / Track No:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {purchase.lrNo}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Delivery By:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {sales?.deliveryBy || "-"}
                    </span>
                  </div>
                  {sales?.consigneeName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Consignee:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {sales.consigneeName}
                      </span>
                    </div>
                  )}
                  {sales?.deliveryTerms && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Terms:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {sales.deliveryTerms}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Items & Particulars ({challan.items?.length || 0})</span>
            </h3>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0A0E1A] dark:bg-[#06080D] border-b border-slate-200 dark:border-white/[0.08] text-white dark:text-[#E8C16D]">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10 font-bold uppercase">#</th>
                    <th className="px-3 py-2.5 font-bold uppercase">Particulars SKU</th>
                    <th className="px-3 py-2.5 font-bold uppercase">Particulars Name</th>
                    {isPurchase && (
                      <>
                        <th className="px-3 py-2.5 font-bold uppercase">Party Challan No</th>
                        <th className="px-3 py-2.5 text-center font-bold uppercase">Ordered</th>
                        <th className="px-3 py-2.5 text-center font-bold uppercase">Received</th>
                      </>
                    )}
                    {!isPurchase && (
                      <th className="px-3 py-2.5 text-center font-bold uppercase">Dispatched Qty</th>
                    )}
                    <th className="px-3 py-2.5 text-right font-bold uppercase">Rate (₹)</th>
                    <th className="px-3 py-2.5 text-right font-bold uppercase">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {challan.items && challan.items.length > 0 ? (
                    challan.items.map((item: any, idx: number) => {
                      const itemQty = isPurchase ? item.receivedQty : item.quantity;
                      const itemAmt =
                        item.amount !== undefined && item.amount !== null
                          ? item.amount
                          : (Number(itemQty) || 0) * (Number(item.rate) || 0);

                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                            {item.itemNo || idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                            {item.name || "-"}
                          </td>

                          {isPurchase && (
                            <>
                              <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                                {item.partyChallanNo || "-"}
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                                {item.orderedQty || 0}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                                  {item.receivedQty}
                                </span>
                              </td>
                            </>
                          )}

                          {!isPurchase && (
                            <td className="px-3 py-2.5 text-center">
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                                {item.quantity}
                              </span>
                            </td>
                          )}

                          <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            ₹{(Number(item.rate) || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{itemAmt.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={isPurchase ? 8 : 6}
                        className="py-6 text-center text-slate-400"
                      >
                        No items found in this challan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Summary Footer */}
            <div className="bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/[0.08] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Items: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {challan.items?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{qtyLabel} </span>
                  <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">
                    {totalQty} units
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isPurchase ? "Total Inward Value:" : "Total Dispatch Value:"}
                </span>
                <span className="text-base font-bold font-mono text-[#B88728] dark:text-[#E8C16D]">
                  ₹{(challan.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
