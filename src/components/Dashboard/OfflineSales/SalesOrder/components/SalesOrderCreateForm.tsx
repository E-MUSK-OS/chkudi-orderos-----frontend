"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  X,
  User,
  UserPlus,
  Search,
  Check,
  ChevronsUpDown,
  ClipboardList,
  Save,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrentUserName } from "@/utils/auth";
import { Party } from "@/components/Dashboard/OfflineSales/SalesChallan/types/challan.types";
import { challanService } from "@/components/Dashboard/OfflineSales/SalesChallan/services/challan.service";
import { ProductSkuSuggestion } from "@/components/Dashboard/Purchase/PurchaseChallan/types/purchaseChallan.types";
import { purchaseChallanService } from "@/components/Dashboard/Purchase/PurchaseChallan/services/purchaseChallan.service";
import { SalesOrder, SalesOrderItem } from "../types/salesOrder.types";
import { salesOrderService } from "../services/salesOrder.service";

interface SalesOrderCreateFormProps {
  order?: SalesOrder | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const salesForOptions: ThemeSelectOption[] = [
  { value: "Product", label: "Product" },
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
];

const orderStatusOptions: ThemeSelectOption[] = [
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Completed", label: "Completed" },
];

const STATE_CODE_MAP: Record<string, string> = {
  Gujarat: "24",
  Maharashtra: "27",
  Delhi: "07",
  Karnataka: "29",
  "Tamil Nadu": "33",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  "West Bengal": "19",
  Telangana: "36",
  "Andhra Pradesh": "37",
  Haryana: "06",
  Punjab: "03",
  "Madhya Pradesh": "23",
  Bihar: "10",
  Kerala: "32",
};

function getStateCode(state?: string | null, gstin?: string | null): string {
  if (gstin && gstin.length >= 2 && /^\d{2}/.test(gstin)) {
    return gstin.slice(0, 2);
  }
  if (!state) return "24";
  return STATE_CODE_MAP[state] || "24";
}

function addDaysToDateStr(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return baseDateStr;
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().split("T")[0];
}

interface ProductSkuDropdownProps {
  value: string;
  options: ProductSkuSuggestion[];
  onSelect: (opt: ProductSkuSuggestion) => void;
  onManualChange: (val: string) => void;
}

function ProductSkuDropdown({
  value,
  options,
  onSelect,
  onManualChange,
}: ProductSkuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 260,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 280),
        });
      }
    };
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 100);
    return options
      .filter(
        (o) =>
          o.sku.toLowerCase().includes(q) ||
          (o.name && o.name.toLowerCase().includes(q))
      )
      .slice(0, 100);
  }, [options, search]);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-8 px-2.5 text-xs text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white flex items-center justify-between gap-1.5 cursor-pointer hover:border-[#E8C16D] transition-colors"
      >
        <span className={`truncate ${value ? "font-medium" : "text-slate-400"}`}>
          {value || "Select Product..."}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
            }}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] shadow-2xl p-2 flex flex-col gap-1.5"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B0E14] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-2.5 text-center space-y-2">
                  <p className="text-[11px] text-slate-400">No matching SKU found</p>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onManualChange(search.trim());
                        setOpen(false);
                        setSearch("");
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-[11px] font-bold cursor-pointer"
                    >
                      Use &quot;{search.trim()}&quot;
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.sku}
                    type="button"
                    onClick={() => {
                      onSelect(opt);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      value === opt.sku
                        ? "bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-bold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="truncate">{opt.sku}</span>
                    {opt.name && opt.name !== opt.sku && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px] shrink-0">
                        {opt.name}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default function SalesOrderCreateForm({
  order,
  onSuccess,
  onCancel,
}: SalesOrderCreateFormProps) {
  const isEditing = Boolean(order?.id);
  const todayStr = new Date().toISOString().split("T")[0];

  const [orderNo, setOrderNo] = useState(order?.orderNo || "");
  const [orderDate, setOrderDate] = useState(
    order?.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : todayStr
  );
  const [salesFor, setSalesFor] = useState(order?.salesFor || "Product");
  const [poNo, setPoNo] = useState(order?.poNo || "");
  const [poDate, setPoDate] = useState(
    order?.poDate ? new Date(order.poDate).toISOString().split("T")[0] : ""
  );

  // Party State
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyDrawerOpen, setPartyDrawerOpen] = useState(false);
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [skuOptions, setSkuOptions] = useState<ProductSkuSuggestion[]>([]);

  const [preparedBy, setPreparedBy] = useState(order?.preparedBy || "");
  useEffect(() => {
    if (!order?.preparedBy) {
      setPreparedBy((prev) => prev || getCurrentUserName());
    }
  }, [order?.preparedBy]);

  const [remarks, setRemarks] = useState(order?.remarks || "");
  const [soDays, setSoDays] = useState<number>(Number(order?.soDays) || 0);
  const [expRequiredDays, setExpRequiredDays] = useState<number>(
    Number(order?.expRequiredDays) || 0
  );
  const [expDeliveryDate, setExpDeliveryDate] = useState(
    order?.expDeliveryDate
      ? new Date(order.expDeliveryDate).toISOString().split("T")[0]
      : todayStr
  );
  const [deliveryStatus, setDeliveryStatus] = useState(
    order?.deliveryStatus || "Pending"
  );
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<SalesOrderItem[]>(
    order?.items && order.items.length > 0 ? order.items : []
  );

  const partyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => setPartyDrawerOpen(true), 150);
      salesOrderService
        .getNextOrderNo()
        .then((nextNo) => setOrderNo(nextNo))
        .catch(() => setOrderNo("SO/2026-2027/1"));

      challanService
        .getParties("")
        .then((list) => setParties(list))
        .catch((err) => console.error("Failed to fetch parties:", err));

      purchaseChallanService
        .searchSkus("")
        .then((list) => setSkuOptions(list || []))
        .catch(() => {});

      return () => clearTimeout(timer);
    }

    challanService
      .getParties("")
      .then((list) => {
        setParties(list);
        if (order?.partyId || order?.partyName) {
          const match = list.find(
            (p) => p.id === order.partyId || p.partyName === order.partyName
          );
          if (match) setSelectedParty(match);
        }
      })
      .catch((err) => console.error("Failed to fetch parties:", err));

    purchaseChallanService
      .searchSkus("")
      .then((list) => setSkuOptions(list || []))
      .catch(() => {});
  }, [isEditing, order?.partyId, order?.partyName]);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (
        partyDropdownRef.current &&
        !partyDropdownRef.current.contains(e.target as Node)
      ) {
        setPartyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, []);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows || rows.length === 0) {
        toast.error("Uploaded file has no rows.");
        return;
      }

      const imported: SalesOrderItem[] = [];
      rows.forEach((raw, idx) => {
        // Normalize keys case-insensitively
        const norm: Record<string, any> = {};
        Object.keys(raw).forEach((k) => {
          norm[k.trim().toLowerCase()] = raw[k];
        });

        const skuVal = String(
          norm["product sku"] ??
            norm["sku"] ??
            norm["product / material / service sku"] ??
            norm["product"] ??
            norm["particular"] ??
            ""
        ).trim();
        if (!skuVal) return;

        const matchedSku = skuOptions.find(
          (s) => s.sku.toLowerCase() === skuVal.toLowerCase()
        );
        const sizeVal = String(norm["size"] ?? "").trim();
        const qtyVal =
          Number(
            norm["qty"] ?? norm["quantity"] ?? norm["order qty"] ?? norm["qty."] ?? 1
          ) || 1;
        const rawRate = Number(norm["rate"] ?? norm["price"] ?? norm["rate."] ?? 0);
        const rateVal = rawRate > 0 ? rawRate : matchedSku?.rate || 0;
        const amountVal = Math.round(qtyVal * rateVal * 100) / 100;

        imported.push({
          itemNo: items.length + imported.length + 1,
          sku: matchedSku?.sku || skuVal,
          particular:
            String(norm["particular"] ?? norm["name"] ?? "").trim() ||
            matchedSku?.name ||
            skuVal,
          size: sizeVal,
          quantity: qtyVal,
          rate: rateVal,
          amount: amountVal,
        });
      });

      if (imported.length === 0) {
        toast.error(
          "No valid rows found. Ensure a column named SKU / Product SKU / Product is present."
        );
        return;
      }

      setItems((prev) =>
        [...prev, ...imported].map((it, i) => ({ ...it, itemNo: i + 1 }))
      );
      toast.success(`Imported ${imported.length} item(s) from ${file.name}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to parse uploaded file.");
    } finally {
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        itemNo: prev.length + 1,
        sku: "",
        particular: "",
        size: "",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((r, i) => ({ ...r, itemNo: i + 1 }))
    );
  };

  const updateRowField = (
    index: number,
    field: keyof SalesOrderItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === "sku") updated.particular = value;
        const qty = Number(updated.quantity) || 0;
        const rate = Number(updated.rate) || 0;
        updated.amount = Math.round(qty * rate * 100) / 100;
        return updated;
      })
    );
  };

  const handleSelectSku = (index: number, opt: ProductSkuSuggestion) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const qty = Number(row.quantity) > 0 ? Number(row.quantity) : 1;
        const rate = opt.rate || Number(row.rate) || 0;
        return {
          ...row,
          sku: opt.sku,
          particular: opt.name || opt.sku,
          quantity: qty,
          rate,
          amount: Math.round(qty * rate * 100) / 100,
        };
      })
    );
  };

  const totals = useMemo(() => {
    const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const totalAmt =
      Math.round(items.reduce((s, it) => s + (Number(it.amount) || 0), 0) * 100) / 100;
    return { totalQty, totalAmt };
  }, [items]);

  const filteredParties = useMemo(() => {
    const q = partySearch.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.partyName.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [parties, partySearch]);

  const handleSubmit = async () => {
    if (!selectedParty) {
      toast.error("Please select a Party.");
      setPartyDrawerOpen(true);
      return;
    }
    const validItems = items.filter((it) => it.sku && it.sku.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one product row.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        partyId: selectedParty.id,
        orderNo,
        orderDate,
        salesFor,
        poNo: poNo || null,
        poDate: poDate || null,
        partyName: selectedParty.partyName,
        contactNo: selectedParty.phone || null,
        partyGstn: selectedParty.gstin || null,
        stateCode: getStateCode(selectedParty.state, selectedParty.gstin),
        deliveryStatus,
        fulfillmentPlan: "Completed",
        expRequiredDays: Number(expRequiredDays) || 0,
        expDeliveryDate: expDeliveryDate || null,
        soDays: Number(soDays) || 0,
        preparedBy: preparedBy || getCurrentUserName(),
        remarks: remarks || null,
        items: validItems.map((it, idx) => ({
          ...it,
          itemNo: idx + 1,
          particular: it.particular || it.sku,
        })),
      };

      if (isEditing && order?.id) {
        await salesOrderService.updateOrder(order.id, payload);
        toast.success(`Sales Order ${orderNo} updated!`);
      } else {
        await salesOrderService.createOrder(payload);
        toast.success(`Sales Order ${orderNo} created!`);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Sales Order.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Top Header Bar */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#0A0E1A] dark:text-white tracking-tight">
                Order [ Sale ]
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Offline Sales • Sales Order
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/20 active:scale-[0.98] cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Back to List</span>
            </button>

            <div className="h-9 sm:h-10 px-3.5 rounded-xl sm:rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-mono font-bold text-xs sm:text-sm flex items-center select-all">
              {orderNo || "SO/2026-2027/1"}
            </div>
            <div className="w-36">
              <DatePicker
                allowInput
                value={orderDate}
                onChange={(_, str) => setOrderDate(str || todayStr)}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                className="w-full"
                buttonClassName="h-9 sm:h-10 px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-md hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] shrink-0 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Order"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Meta Bar */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Sales For
              </label>
              <div className="w-36">
                <ThemeSelectDropdown
                  value={salesFor}
                  onChange={setSalesFor}
                  options={salesForOptions}
                  buttonClassName="h-9 px-3 text-xs font-semibold rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                PO No.
              </label>
              <input
                type="text"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                placeholder="PO No."
                className="h-9 w-36 px-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                PO Date.
              </label>
              <div className="w-36">
                <DatePicker
                  allowInput
                  value={poDate}
                  onChange={(_, str) => setPoDate(str || "")}
                  placeholder="PO Date"
                  dateFormat="yyyy-MM-dd"
                  className="w-full"
                  buttonClassName="h-9 px-3 rounded-full text-xs font-semibold border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setPartyDrawerOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">
                {selectedParty ? selectedParty.partyName : "Select Party"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Content Area (Scoped for Party Details Drawer) */}
      <div className="relative min-h-[540px] sm:min-h-[600px] overflow-x-clip space-y-4">
        {/* Items Table */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                  <th className="py-3 px-3 text-center w-12">No.</th>
                  <th className="py-3 px-3 min-w-[240px]">
                    Product / Material / Service SKU.
                  </th>
                  <th className="py-3 px-3 w-28">Size</th>
                  <th className="py-3 px-3 w-28 text-right">Qty.</th>
                  <th className="py-3 px-3 w-32 text-right">Rate.</th>
                  <th className="py-3 px-3 w-32 text-right">Amount.</th>
                  <th className="py-3 px-3 w-12 text-center">Del.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E8D0]/60 dark:divide-white/[0.06] text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D]">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">No data available</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[#FEFAEE]/50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-full min-w-[220px]">
                          <ProductSkuDropdown
                            value={row.sku}
                            options={skuOptions}
                            onSelect={(opt) => handleSelectSku(idx, opt)}
                            onManualChange={(val) => updateRowField(idx, "sku", val)}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.size || ""}
                          onChange={(e) => updateRowField(idx, "size", e.target.value)}
                          placeholder="Size"
                          className="w-24 h-8 px-2 text-xs text-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={row.quantity}
                          onChange={(e) =>
                            updateRowField(idx, "quantity", e.target.value)
                          }
                          className="w-24 h-8 px-2 text-xs text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.rate}
                          onChange={(e) => updateRowField(idx, "rate", e.target.value)}
                          className="w-28 h-8 px-2 text-xs text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                        ₹ {Number(row.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E8C16D]/40 bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-bold">
                  <td colSpan={3} className="py-2.5 px-3 text-right text-slate-500">
                    Total:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#0A0E1A] dark:text-white">
                    {totals.totalQty}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">Total:</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#B88728] dark:text-[#E8C16D]">
                    ₹ {totals.totalAmt.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-3 border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <input
              ref={uploadInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUploadExcel}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] cursor-pointer transition-colors"
              title="Upload Excel / CSV (.xlsx, .xls, .csv)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </section>

        {/* 4. Bottom Footer Bar */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Remarks.
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Remark"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Exp. Required Days
                </label>
                <input
                  type="number"
                  min={0}
                  value={expRequiredDays}
                  onChange={(e) => {
                    const days = Number(e.target.value) || 0;
                    setExpRequiredDays(days);
                    setExpDeliveryDate(addDaysToDateStr(orderDate, days));
                  }}
                  className="h-9 w-20 px-2.5 text-xs text-right font-mono rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Exp. Required Date
                </label>
                <div className="w-36">
                  <DatePicker
                    allowInput
                    value={expDeliveryDate}
                    onChange={(_, str) => setExpDeliveryDate(str || todayStr)}
                    placeholder="YYYY-MM-DD"
                    dateFormat="yyyy-MM-dd"
                    className="w-full"
                    buttonClassName="h-9 px-2.5 rounded-xl text-xs font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Order Status
                </label>
                <div className="w-32">
                  <ThemeSelectDropdown
                    value={deliveryStatus}
                    onChange={setDeliveryStatus}
                    options={orderStatusOptions}
                    buttonClassName="h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E7E0D2]/60 dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Prepared By.
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  readOnly
                  className="h-9 w-28 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D] outline-none cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  SO Days.
                </label>
                <input
                  type="number"
                  min={0}
                  value={soDays}
                  onChange={(e) => setSoDays(Number(e.target.value) || 0)}
                  className="h-9 w-20 px-2.5 text-xs text-right font-mono rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-9 sm:h-10 px-6 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </section>

        {/* 5. Slide-over Party Details Drawer */}
        <div
          className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            partyDrawerOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setPartyDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden ${
            partyDrawerOpen
              ? "translate-x-0 pointer-events-auto"
              : "translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 shrink-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Party Details
            </h2>
            <button
              type="button"
              onClick={() => setPartyDrawerOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#121620] p-3.5 sm:p-4 space-y-3.5">
              <div className="space-y-1.5 relative" ref={partyDropdownRef}>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Party
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setPartyDropdownOpen((o) => !o)}
                      className={`w-full h-9 sm:h-10 px-3.5 flex items-center justify-between rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer ${
                        partyDropdownOpen
                          ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                      }`}
                    >
                      <span className="truncate">
                        {selectedParty ? selectedParty.partyName : "Select..."}
                      </span>
                      <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info("Add new party from Ledger Book")}
                    className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all cursor-pointer"
                    title="Add New Party"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {partyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
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
                      {filteredParties.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No parties found
                        </div>
                      ) : (
                        filteredParties.map((p) => {
                          const isSelected = selectedParty?.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedParty(p);
                                setPartyDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{p.partyName}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {[p.phone, p.city, p.state].filter(Boolean).join(" • ") || "—"}
                                </p>
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

              <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F1626] text-slate-400">
                  <User className="w-7 h-7" />
                </div>
                <div className="col-span-9 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Name</div>
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {selectedParty?.partyName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Mobile</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedParty?.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Address</div>
                    <div className="text-slate-700 dark:text-slate-300 truncate">
                      {(selectedParty as any)?.address1 ||
                        selectedParty?.addressLine1 ||
                        selectedParty?.city ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">GST</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
                      {selectedParty?.gstin || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPartyDrawerOpen(false)}
                className="h-9 px-5 rounded-xl bg-[#E8C16D] text-[#0A0E1A] text-xs font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
