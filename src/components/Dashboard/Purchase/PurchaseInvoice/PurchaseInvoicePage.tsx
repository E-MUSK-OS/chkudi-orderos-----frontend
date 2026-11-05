"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import PurchaseInvoiceHeader from "./components/PurchaseInvoiceHeader";
import PurchaseInvoiceListHeader from "./components/PurchaseInvoiceListHeader";
import PurchaseInvoiceFilters from "./components/PurchaseInvoiceFilters";
import PurchaseInvoiceTable from "./components/PurchaseInvoiceTable";
import PurchaseInvoiceMetaForm from "./components/PurchaseInvoiceMetaForm";
import PurchaseInvoiceItemsTable from "./components/PurchaseInvoiceItemsTable";
import PurchaseInvoicePartyDetails from "./components/PurchaseInvoicePartyDetails";
import PurchaseInvoiceSummaryFooter from "./components/PurchaseInvoiceSummaryFooter";
import DeletePurchaseInvoiceModal from "./components/DeletePurchaseInvoiceModal";

import {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseInvoiceFormData,
  PurchaseInvoiceFilterState,
} from "./types/purchaseInvoice.types";
import { purchaseInvoiceService } from "./services/purchaseInvoice.service";
import { purchaseChallanService } from "../PurchaseChallan/services/purchaseChallan.service";
import {
  calculateItemGst,
  calculateInvoiceTotals,
  extractStateCode,
} from "./utils/purchaseGstCalculator";
import { toast } from "sonner";

function getTodayFormatted(): string {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  return `${d}-${m}-${y}`;
}

export default function PurchaseInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challanIdParam = searchParams.get("challanId");

  // Mode: "list" (Directory table view) | "create" (New invoice form) | "edit" (Edit invoice form)
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">(
    challanIdParam ? "create" : "list"
  );

  // List View State
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [filters, setFilters] = useState<PurchaseInvoiceFilterState>({
    search: "",
    invoiceNo: "",
    challanNo: "",
    partyName: "",
    productSku: "",
    startDate: "",
    endDate: "",
    invoiceType: "All",
    status: "All",
  });
  const filtersRef = useRef(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form View State
  const [activeInvoice, setActiveInvoice] = useState<PurchaseInvoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState<PurchaseInvoiceFormData>({
    invoiceType: "Tax Invoice",
    invoiceNo: "",
    invoiceDate: getTodayFormatted(),
    challanId: null,
    challanNo: "",
    challanDate: "",
    supplierId: null,
    partyId: null,
    partyGstn: "",
    stateCode: "24",
    brokerName: "",
    consigneeName: "",
    editOn: true,
    remarks: "",
    ewayBillNo: "",
    expenseOnPurchase: 0,
    hasReceipt: false,
    receivedAmount: 0,
    receiptMode: "Select Mode",
    receiptAccount: "",
    transactionType: "Cheque",
    transactionDate: getTodayFormatted(),
    chequeNo: "",
    bankName: "",
    applyRoundOff: true,
    billingPartyName: "",
    billingAddress: "",
    billingCity: "",
    billingState: "Gujarat",
    billingPincode: "",
    billingEmail: "",
    billingMobile: "",
    shippingPartyName: "",
    shippingAddress: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingState: "Gujarat",
    shippingPincode: "",
    shippingContact: "",
    courierPartner: "",
    trackingNo: "",
    items: [],
  });

  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);

  // -------------------------------------------------------------
  // List View Data Fetching
  // -------------------------------------------------------------
  const fetchInvoices = useCallback(async (customFilters?: PurchaseInvoiceFilterState) => {
    try {
      setListLoading(true);
      const activeFilters = customFilters || filtersRef.current;
      const res = await purchaseInvoiceService.getInvoices(activeFilters);
      setInvoices(res.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load purchase invoices.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "list") {
      fetchInvoices();
    }
  }, [viewMode, fetchInvoices]);

  const handleFilterChange = (
    field: keyof PurchaseInvoiceFilterState,
    value: string
  ) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (
      value.trim() === "" ||
      field === "invoiceType" ||
      field === "status"
    ) {
      fetchInvoices(nextFilters);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        fetchInvoices(nextFilters);
      }, 350);
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const nextFilters = { ...filters, startDate, endDate };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;
    fetchInvoices(nextFilters);
  };

  const handleFilterSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchInvoices(filtersRef.current);
  };

  const handleFilterReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const defaultFilters: PurchaseInvoiceFilterState = {
      search: "",
      invoiceNo: "",
      challanNo: "",
      partyName: "",
      productSku: "",
      startDate: "",
      endDate: "",
      invoiceType: "All",
      status: "All",
    };
    setFilters(defaultFilters);
    filtersRef.current = defaultFilters;
    fetchInvoices(defaultFilters);
  };

  // -------------------------------------------------------------
  // Form View Handlers
  // -------------------------------------------------------------
  const handleFormChange = (fields: Partial<PurchaseInvoiceFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...fields };

      if (fields.stateCode && fields.stateCode !== prev.stateCode) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            calculateItemGst(item, "24", fields.stateCode || "24")
          )
        );
      }

      return next;
    });
  };

  const handleItemsChange = (newItems: PurchaseInvoiceItem[]) => {
    setItems(newItems);
  };

  const computedTotals = useMemo(() => {
    return calculateInvoiceTotals(
      items,
      undefined,
      formData.expenseOnPurchase || 0,
      formData.applyRoundOff !== false
    );
  }, [items, formData.expenseOnPurchase, formData.applyRoundOff]);

  const initNextInvoiceNo = async () => {
    try {
      const nextNo = await purchaseInvoiceService.getNextInvoiceNo();
      setFormData((prev) => ({
        ...prev,
        invoiceNo: nextNo,
      }));
    } catch (err) {
      console.error("Failed to generate next invoice sequence:", err);
      setFormData((prev) => ({
        ...prev,
        invoiceNo: "1",
      }));
    }
  };

  const handleResetToNew = async () => {
    setActiveInvoice(null);
    const initialItem: PurchaseInvoiceItem = {
      itemNo: 1,
      sku: "",
      particular: "",
      hsn: "5208",
      quantity: "",
      rate: "",
      amount: "",
      discountPercent: "",
      discountAmount: "",
      taxableAmount: "",
      sgstRate: 2.5,
      sgstAmount: "",
      cgstRate: 2.5,
      cgstAmount: "",
      igstRate: "",
      igstAmount: "",
      total: "",
    };

    setFormData({
      invoiceType: "Tax Invoice",
      invoiceNo: "",
      invoiceDate: getTodayFormatted(),
      challanId: null,
      challanNo: "",
      challanDate: "",
      supplierId: null,
      partyId: null,
      partyGstn: "",
      stateCode: "24",
      brokerName: "",
      consigneeName: "",
      editOn: true,
      remarks: "",
      ewayBillNo: "",
      expenseOnPurchase: 0,
      hasReceipt: false,
      receivedAmount: 0,
      receiptMode: "Select Mode",
      receiptAccount: "",
      transactionType: "Cheque",
      transactionDate: getTodayFormatted(),
      chequeNo: "",
      bankName: "",
      applyRoundOff: true,
      billingPartyName: "",
      billingAddress: "",
      billingCity: "",
      billingState: "Gujarat",
      billingPincode: "",
      billingEmail: "",
      billingMobile: "",
      shippingPartyName: "",
      shippingAddress: "",
      shippingAddress2: "",
      shippingCity: "",
      shippingState: "Gujarat",
      shippingPincode: "",
      shippingContact: "",
      courierPartner: "",
      trackingNo: "",
      items: [initialItem],
    });
    setItems([initialItem]);
    await initNextInvoiceNo();
    setViewMode("create");
  };

  function formatDateForPicker(dateVal: any): string {
    if (!dateVal) return "";
    const str = String(dateVal);
    const dmy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return str;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const populateFromInvoice = (inv: PurchaseInvoice) => {
    setActiveInvoice(inv);
    const isRoundOffApplied =
      inv.roundOff !== undefined && inv.roundOff !== null
        ? Number(inv.roundOff) !== 0 || Number(inv.amountAfterTax || 0) % 1 === 0
        : true;

    setFormData({
      invoiceType: inv.invoiceType || "Tax Invoice",
      invoiceNo: inv.invoiceNo,
      invoiceDate: formatDateForPicker(inv.invoiceDate),
      challanId: inv.challanId || null,
      challanNo: inv.challanNo || "",
      challanDate: formatDateForPicker(inv.challanDate),
      supplierId: inv.supplierId || null,
      partyId: inv.supplierId || null,
      partyGstn: inv.partyGstn || "",
      stateCode: inv.stateCode || "24",
      brokerName: inv.brokerName || "",
      consigneeName: inv.consigneeName || "",
      editOn: inv.editOn ?? true,
      remarks: inv.remarks || "",
      ewayBillNo: inv.ewayBillNo || "",
      expenseOnPurchase: inv.expenseOnPurchase || 0,
      hasReceipt: inv.hasReceipt || false,
      receivedAmount:
        inv.receivedAmount !== undefined && inv.receivedAmount !== null
          ? Number(inv.receivedAmount)
          : 0,
      receiptMode: inv.receiptMode || "Select Mode",
      receiptAccount: inv.receiptAccount || "",
      transactionType: inv.transactionType || "Cheque",
      transactionDate: inv.transactionDate
        ? formatDateForPicker(inv.transactionDate)
        : getTodayFormatted(),
      chequeNo: inv.chequeNo || "",
      bankName: inv.bankName || "",
      applyRoundOff: isRoundOffApplied,
      billingPartyName: inv.billingPartyName || "",
      billingAddress: inv.billingAddress || "",
      billingCity: inv.billingCity || "",
      billingState: inv.billingState || "Gujarat",
      billingPincode: inv.billingPincode || "",
      billingEmail: inv.billingEmail || "",
      billingMobile: inv.billingMobile || "",
      shippingPartyName: inv.shippingPartyName || "",
      shippingAddress: inv.shippingAddress || "",
      shippingAddress2: inv.shippingAddress2 || "",
      shippingCity: inv.shippingCity || "",
      shippingState: inv.shippingState || "Gujarat",
      shippingPincode: inv.shippingPincode || "",
      shippingContact: inv.shippingContact || "",
      courierPartner: inv.courierPartner || "",
      trackingNo: inv.trackingNo || "",
      items: inv.items || [],
    });
    setItems(inv.items || []);
    setViewMode("edit");
  };

  // Load from Purchase Challan (when clicking Invoice icon from Purchase Challan table)
  const loadChallanForInvoice = useCallback(async (challanId: string) => {
    try {
      setLoading(true);
      const existing = await purchaseInvoiceService.getInvoiceByChallanId(challanId);
      if (existing) {
        populateFromInvoice(existing);
        toast.info(`Opened existing Purchase Invoice #${existing.invoiceNo} for this challan.`);
        return;
      }

      const res = await purchaseChallanService.getChallanById(challanId);
      const ch = res.data;
      if (!ch) throw new Error("Purchase Challan not found.");

      const nextNo = await purchaseInvoiceService.getNextInvoiceNo();
      const supplierAny = ch.supplier as any;
      const partyGstn = supplierAny?.gstin || "";
      const partyState = supplierAny?.state || "Gujarat";
      const stateCode = extractStateCode(partyGstn, partyState);

      const mappedItems: PurchaseInvoiceItem[] = (ch.items || []).map((it, idx) => {
        const qty = it.receivedQty || it.orderedQty || 1;
        const rate = it.rate || 0;
        const rawItem: Partial<PurchaseInvoiceItem> = {
          itemNo: idx + 1,
          sku: it.sku,
          particular: it.name || it.sku,
          hsn: "5208",
          quantity: qty,
          rate: rate,
          amount: Math.round(qty * rate * 100) / 100,
          discountPercent: 0,
          discountAmount: 0,
          taxableAmount: Math.round(qty * rate * 100) / 100,
          igstRate: 5.0,
        };
        return calculateItemGst(rawItem, "24", stateCode);
      });

      const initialData: PurchaseInvoiceFormData = {
        invoiceType: "Tax Invoice",
        invoiceNo: nextNo,
        invoiceDate: getTodayFormatted(),
        challanId: ch.id,
        challanNo: ch.challanNo,
        challanDate: formatDateForPicker(ch.challanDate),
        supplierId: ch.supplierId || null,
        partyId: ch.supplierId || null,
        partyGstn: partyGstn,
        stateCode: stateCode,
        brokerName: "",
        consigneeName: "",
        editOn: true,
        remarks: `Converted from Purchase Challan #${ch.challanNo}`,
        ewayBillNo: "",
        expenseOnPurchase: 0,
        hasReceipt: false,
        receivedAmount: 0,
        receiptMode: "Select Mode",
        receiptAccount: "",
        transactionType: "Cheque",
        transactionDate: getTodayFormatted(),
        chequeNo: "",
        bankName: "",
        applyRoundOff: true,
        billingPartyName: ch.supplierName,
        billingAddress: supplierAny?.address1 || supplierAny?.addressLine1 || "",
        billingCity: supplierAny?.city || "",
        billingState: partyState,
        billingPincode: supplierAny?.pincode || "",
        billingEmail: supplierAny?.email || "",
        billingMobile: ch.contactNo || supplierAny?.phone || "",
        shippingPartyName: ch.supplierName,
        shippingAddress: supplierAny?.address1 || supplierAny?.addressLine1 || "",
        shippingCity: supplierAny?.city || "",
        shippingState: partyState,
        shippingPincode: supplierAny?.pincode || "",
        shippingContact: ch.contactNo || supplierAny?.phone || "",
        courierPartner: ch.courierPartner || "",
        trackingNo: ch.lrNo || "",
        items: mappedItems,
      };

      setFormData(initialData);
      setItems(mappedItems);
      setViewMode("create");
      toast.success(`Pre-filled purchase invoice from Challan #${ch.challanNo}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load purchase challan for invoice.");
      setViewMode("list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (challanIdParam) {
      loadChallanForInvoice(challanIdParam);
    }
  }, [challanIdParam, loadChallanForInvoice]);

  // -------------------------------------------------------------
  // Save & Update Invoice
  // -------------------------------------------------------------
  const handleSaveInvoice = async () => {
    if (!formData.billingPartyName || !formData.billingPartyName.trim()) {
      toast.error("Please enter Supplier / Billing Party Name.");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const hasEmptySku = items.some((it) => !it.sku || !it.sku.trim());
    if (hasEmptySku) {
      toast.error("All items must have a Product SKU.");
      return;
    }

    try {
      setSaving(true);
      const payload: PurchaseInvoiceFormData = {
        ...formData,
        hasReceipt: Boolean(formData.hasReceipt),
        receivedAmount: formData.hasReceipt ? Number(formData.receivedAmount) || 0 : 0,
        receiptMode:
          formData.hasReceipt && formData.receiptMode !== "Select Mode"
            ? formData.receiptMode
            : null,
        receiptAccount: formData.hasReceipt ? formData.receiptAccount || null : null,
        transactionType:
          formData.hasReceipt && formData.receiptMode === "Bank"
            ? formData.transactionType || "Cheque"
            : null,
        transactionDate:
          formData.hasReceipt && formData.receiptMode === "Bank"
            ? formData.transactionDate || formData.invoiceDate || getTodayFormatted()
            : null,
        chequeNo:
          formData.hasReceipt && formData.receiptMode === "Bank" ? formData.chequeNo || null : null,
        bankName:
          formData.hasReceipt && formData.receiptMode === "Bank" ? formData.bankName || null : null,
        ...computedTotals,
        items,
      };

      if (viewMode === "edit" && activeInvoice) {
        const updated = await purchaseInvoiceService.updateInvoice(activeInvoice.id, payload);
        toast.success(`Purchase Invoice #${updated.invoiceNo} updated successfully!`);
        populateFromInvoice(updated);
      } else {
        const created = await purchaseInvoiceService.createInvoice(payload);
        toast.success(`Purchase Invoice #${created.invoiceNo} generated successfully!`);
        populateFromInvoice(created);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save purchase invoice.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Delete Invoice
  // -------------------------------------------------------------
  const handleDeleteClick = (inv: PurchaseInvoice) => {
    setDeletingInvoice(inv);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    try {
      setDeleting(true);
      await purchaseInvoiceService.deleteInvoice(deletingInvoice.id);
      toast.success(`Purchase Invoice #${deletingInvoice.invoiceNo} deleted successfully.`);
      setDeleteModalOpen(false);
      setDeletingInvoice(null);
      if (viewMode !== "list") {
        setViewMode("list");
      }
      fetchInvoices();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete purchase invoice.");
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // Excel Export Handlers
  // -------------------------------------------------------------
  const handleDownloadDetail = async () => {
    try {
      if (viewMode !== "list") {
        await purchaseInvoiceService.downloadSingleInvoiceDetail(formData, items);
        toast.success(`Downloaded Purchase Invoice #${formData.invoiceNo || ""} Detail Excel`);
      } else {
        const downloadFilters =
          selectedInvoiceIds.length > 0
            ? { ...filters, ids: selectedInvoiceIds.join(",") }
            : filters;
        await purchaseInvoiceService.downloadDetail(downloadFilters);
        toast.success(
          selectedInvoiceIds.length > 0
            ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) Detail Excel`
            : "Detail excel report downloaded!"
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download detail excel.");
    }
  };

  const handleDownloadSkuWise = async () => {
    try {
      if (viewMode !== "list") {
        await purchaseInvoiceService.downloadSingleInvoiceSkuWise(formData, items);
        toast.success(`Downloaded Purchase Invoice #${formData.invoiceNo || ""} SKU Wise Excel`);
      } else {
        const downloadFilters =
          selectedInvoiceIds.length > 0
            ? { ...filters, ids: selectedInvoiceIds.join(",") }
            : filters;
        await purchaseInvoiceService.downloadSkuWise(downloadFilters);
        toast.success(
          selectedInvoiceIds.length > 0
            ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) SKU Wise Excel`
            : "SKU Wise report downloaded!"
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download SKU wise excel.");
    }
  };

  const handleDownloadTally = async () => {
    try {
      if (viewMode !== "list") {
        await purchaseInvoiceService.downloadSingleInvoiceTally(formData, items);
        toast.success(`Downloaded Purchase Invoice #${formData.invoiceNo || ""} Tally Excel`);
      } else {
        const downloadFilters =
          selectedInvoiceIds.length > 0
            ? { ...filters, ids: selectedInvoiceIds.join(",") }
            : filters;
        await purchaseInvoiceService.downloadTally(downloadFilters);
        toast.success(
          selectedInvoiceIds.length > 0
            ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) Tally Excel`
            : "Tally format report downloaded!"
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download Tally excel.");
    }
  };

  const handleDownloadAll = async () => {
    try {
      const invoicesToExport =
        selectedInvoiceIds.length > 0
          ? invoices.filter((inv) => selectedInvoiceIds.includes(inv.id))
          : invoices;
      await purchaseInvoiceService.downloadInvoicesTableExcel(invoicesToExport);
      toast.success(
        selectedInvoiceIds.length > 0
          ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) Excel`
          : "Downloaded Invoices Excel"
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download invoices excel.");
    }
  };

  return (
    <DashboardLayout title="Purchase Invoice">
      <div className="space-y-4 sm:space-y-5 pb-12 max-w-[1700px] mx-auto">
        {viewMode === "list" ? (
          <>
            {/* List Header */}
            <PurchaseInvoiceListHeader
              onAddNew={handleResetToNew}
              onDownloadDetail={handleDownloadDetail}
              onDownloadAll={handleDownloadAll}
              onDownloadSummary={handleDownloadAll}
              onDownloadSkuWise={handleDownloadSkuWise}
              onDownloadTally={handleDownloadTally}
              onCloseInvoice={() => router.push("/dashboard/purchase/finish-goods/challan")}
            />

            {/* Filters */}
            <PurchaseInvoiceFilters
              filters={filters}
              onChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onSearch={handleFilterSearch}
              onReset={handleFilterReset}
            />

            {/* Table */}
            <PurchaseInvoiceTable
              invoices={invoices}
              loading={listLoading}
              selectedIds={selectedInvoiceIds}
              onSelectionChange={setSelectedInvoiceIds}
              onEdit={(inv) => populateFromInvoice(inv)}
              onDelete={handleDeleteClick}
              onCreditNote={(inv) => {
                populateFromInvoice(inv);
                toast.info(`Editing invoice #${inv.invoiceNo}`);
              }}
              onPrint={() => {
                window.print();
              }}
              onPrintMultiple={(ids) => {
                if (ids.length === 0) {
                  toast.info("Please select at least one invoice to print.");
                  return;
                }
                window.print();
              }}
            />
          </>
        ) : (
          <>
            {/* Form Header */}
            <PurchaseInvoiceHeader
              invoiceNo={formData.invoiceNo}
              isExisting={Boolean(activeInvoice && activeInvoice.id)}
              saving={saving}
              deleting={deleting}
              onSave={handleSaveInvoice}
              onDelete={() => {
                setDeletingInvoice(activeInvoice);
                setDeleteModalOpen(true);
              }}
              onBack={() => setViewMode("list")}
              onDownloadDetail={handleDownloadDetail}
              onDownloadSkuWise={handleDownloadSkuWise}
              onDownloadTally={handleDownloadTally}
            />

            {/* Top Metadata Fields Bar */}
            <PurchaseInvoiceMetaForm
              formData={formData}
              onChange={handleFormChange}
              disabled={saving || !formData.editOn}
            />

            {/* Main Center Area: Left Items + Right Party Details */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* Left Column: Items Table + Summary Footer */}
              <div className="xl:col-span-8 2xl:col-span-9 space-y-4 sm:space-y-5">
                <PurchaseInvoiceItemsTable
                  items={items}
                  onChange={handleItemsChange}
                  partyStateCode={formData.stateCode || "24"}
                  disabled={saving || !formData.editOn}
                />

                <PurchaseInvoiceSummaryFooter
                  formData={formData}
                  onChange={handleFormChange}
                  computedTotals={computedTotals}
                  disabled={saving || !formData.editOn}
                />
              </div>

              {/* Right Column: Party Details Cards */}
              <div className="xl:col-span-4 2xl:col-span-3 sticky top-4">
                <PurchaseInvoicePartyDetails
                  formData={formData}
                  onChange={handleFormChange}
                  disabled={saving || !formData.editOn}
                />
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeletePurchaseInvoiceModal
          isOpen={deleteModalOpen}
          invoiceNo={deletingInvoice?.invoiceNo}
          loading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingInvoice(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
