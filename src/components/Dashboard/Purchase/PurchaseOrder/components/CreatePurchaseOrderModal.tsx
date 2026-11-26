"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, User, Save } from "lucide-react";
import { PurchaseOrder, PurchaseOrderItem, Party } from "../types/purchaseOrder.types";
import { purchaseOrderService } from "../services/purchaseOrder.service";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { toast } from "sonner";

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit: PurchaseOrder | null;
  onSuccess: () => void;
}

const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Received", label: "Received" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  orderToEdit,
  onSuccess,
}: CreatePurchaseOrderModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [status, setStatus] = useState("Pending");
  const [remarks, setRemarks] = useState("");

  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partySearch, setPartySearch] = useState("");
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      itemNo: 1,
      sku: "",
      name: "",
      size: "M",
      orderedQty: 1,
      rate: 0,
      amount: 0,
      remarks: "",
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Load parties
  useEffect(() => {
    purchaseOrderService.getParties().then(setParties).catch(console.error);
  }, []);

  // Sync state on open or edit
  useEffect(() => {
    if (!isOpen) return;

    if (orderToEdit) {
      setOrderNo(orderToEdit.orderNo);
      setOrderDate(
        orderToEdit.orderDate
          ? new Date(orderToEdit.orderDate).toISOString().split("T")[0]
          : todayStr
      );
      setDeliveryDate(
        orderToEdit.deliveryDate
          ? new Date(orderToEdit.deliveryDate).toISOString().split("T")[0]
          : ""
      );
      setLotNo(orderToEdit.lotNo || "");
      setStatus(orderToEdit.status || "Pending");
      setRemarks(orderToEdit.remarks || "");
      setSelectedParty({
        id: orderToEdit.supplierId || "",
        partyName: orderToEdit.supplierName,
        phone: orderToEdit.contactNo || null,
      });
      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setItems(
          orderToEdit.items.map((it, idx) => ({
            ...it,
            itemNo: it.itemNo || idx + 1,
          }))
        );
      }
    } else {
      // New order
      purchaseOrderService
        .getNextOrderNo()
        .then(setOrderNo)
        .catch(() => setOrderNo("PO-1"));
      setOrderDate(todayStr);
      setDeliveryDate("");
      setLotNo("");
      setStatus("Pending");
      setRemarks("");
      setSelectedParty(null);
      setItems([
        {
          itemNo: 1,
          sku: "",
          name: "",
          size: "M",
          orderedQty: 1,
          rate: 0,
          amount: 0,
          remarks: "",
        },
      ]);
    }
  }, [isOpen, orderToEdit, todayStr]);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === "orderedQty" || field === "rate") {
        const qty = Number(field === "orderedQty" ? value : item.orderedQty) || 0;
        const rate = Number(field === "rate" ? value : item.rate) || 0;
        item.amount = qty * rate;
      }

      next[index] = item;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemNo: prev.length + 1,
        sku: "",
        name: "",
        size: "M",
        orderedQty: 1,
        rate: 0,
        amount: 0,
        remarks: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, itemNo: i + 1 })));
  };

  const totalQty = items.reduce((sum, it) => sum + (Number(it.orderedQty) || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParty?.partyName) {
      toast.error("Please select a Supplier / Party.");
      return;
    }

    if (!orderNo.trim()) {
      toast.error("Order No is required.");
      return;
    }

    const validItems = items.filter((it) => it.sku.trim().length > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with a valid SKU.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        orderNo: orderNo.trim(),
        orderDate,
        deliveryDate: deliveryDate || null,
        lotNo: lotNo.trim() || null,
        status,
        remarks: remarks.trim() || null,
        supplierId: selectedParty.id || null,
        supplierName: selectedParty.partyName,
        contactNo: selectedParty.phone || selectedParty.whatsapp || null,
        items: validItems.map((it, idx) => ({
          itemNo: idx + 1,
          sku: it.sku.trim(),
          name: it.name?.trim() || it.sku.trim(),
          lotNo: lotNo.trim() || null,
          size: it.size || "M",
          orderedQty: Number(it.orderedQty) || 1,
          rate: Number(it.rate) || 0,
          amount: (Number(it.orderedQty) || 1) * (Number(it.rate) || 0),
          remarks: it.remarks || null,
        })),
      };

      if (orderToEdit?.id) {
        await purchaseOrderService.updateOrder(orderToEdit.id, payload);
        toast.success(`Purchase Order ${orderNo} updated successfully!`);
      } else {
        await purchaseOrderService.createOrder(payload);
        toast.success(`Purchase Order ${orderNo} created successfully!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save purchase order.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {orderToEdit ? `Edit Purchase Order #${orderToEdit.orderNo}` : "Create Purchase Order"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fill inward purchase product order details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Top Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Supplier / Party Selector */}
            <div className="sm:col-span-2 relative">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Supplier Party *
              </label>
              <div
                onClick={() => setPartyDropdownOpen((prev) => !prev)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] flex items-center justify-between cursor-pointer hover:border-[#E8C16D]"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {selectedParty?.partyName || "Select Supplier Party..."}
                  </span>
                </div>
                {selectedParty?.phone && (
                  <span className="font-mono text-slate-400 text-[11px]">
                    {selectedParty.phone}
                  </span>
                )}
              </div>

              {partyDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-[#141A29] border border-slate-200 dark:border-white/[0.08] shadow-xl p-2 z-50 space-y-1">
                  <input
                    type="text"
                    value={partySearch}
                    onChange={(e) => setPartySearch(e.target.value)}
                    placeholder="Search supplier..."
                    className="h-8 w-full px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-xs outline-none mb-1 text-slate-900 dark:text-white"
                  />
                  {parties
                    .filter((p) =>
                      p.partyName.toLowerCase().includes(partySearch.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedParty(p);
                          setPartyDropdownOpen(false);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {p.partyName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {p.phone || p.city || ""}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 2. Order No */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Order No *
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="PO-1"
                className="h-10 w-full px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white font-mono font-bold outline-none focus:border-[#E8C16D]"
              />
            </div>

            {/* 3. Lot No */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Lot No.
              </label>
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                placeholder="Lot No"
                className="h-10 w-full px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white font-mono outline-none focus:border-[#E8C16D]"
              />
            </div>

            {/* 4. Order Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Order Date
              </label>
              <DatePicker
                allowInput
                value={orderDate}
                onChange={(_, val) => setOrderDate(val || todayStr)}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                buttonClassName="h-10 w-full px-3 rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white font-semibold"
              />
            </div>

            {/* 5. Delivery Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Delivery Date
              </label>
              <DatePicker
                allowInput
                value={deliveryDate}
                onChange={(_, val) => setDeliveryDate(val || "")}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                buttonClassName="h-10 w-full px-3 rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white font-semibold"
              />
            </div>

            {/* 6. Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <ThemeSelectDropdown
                value={status}
                onChange={setStatus}
                options={statusOptions}
                buttonClassName="h-10 w-full px-3 rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white font-semibold"
              />
            </div>

            {/* 7. Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks / Terms"
                className="h-10 w-full px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Order Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] text-[#B88728] dark:text-[#E8C16D] font-bold hover:bg-[#FFF3D6] transition-colors cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FEFAEE] dark:bg-[#141A29] border-b border-[#F5E6BE] dark:border-white/[0.08] font-bold text-[#6A4D1D] dark:text-white">
                    <th className="py-2 px-2 text-center w-10">No.</th>
                    <th className="py-2 px-3">Product SKU *</th>
                    <th className="py-2 px-3">Particulars / Name</th>
                    <th className="py-2 px-2 text-center w-16">Size</th>
                    <th className="py-2 px-3 text-right w-24">Order Qty *</th>
                    <th className="py-2 px-3 text-right w-24">Rate (₹)</th>
                    <th className="py-2 px-3 text-right w-28">Amount (₹)</th>
                    <th className="py-2 px-2 text-center w-10">Del.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 dark:border-white/[0.04]"
                    >
                      <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={it.sku}
                          onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                          placeholder="Product SKU"
                          className="h-8 w-full px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white font-mono text-xs outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          placeholder="Product Title"
                          className="h-8 w-full px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white text-xs outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          value={it.size || ""}
                          onChange={(e) => handleItemChange(idx, "size", e.target.value)}
                          placeholder="M"
                          className="h-8 w-14 px-1 text-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white text-xs outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={it.orderedQty === 0 ? "0" : it.orderedQty}
                          onChange={(e) => handleItemChange(idx, "orderedQty", e.target.value)}
                          className="h-8 w-20 px-2 text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white text-xs outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.rate === 0 ? "0" : it.rate}
                          onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                          className="h-8 w-20 px-2 text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white text-xs outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                        ₹ {Number(it.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-[#141A29]/80 border-t border-slate-200 dark:border-white/[0.08] font-bold">
                    <td colSpan={4} className="py-2 px-3 text-right uppercase text-slate-400">
                      Total:
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                      {totalQty}
                    </td>
                    <td></td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                      ₹ {totalAmount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : orderToEdit ? "Update Order" : "Save Order"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
