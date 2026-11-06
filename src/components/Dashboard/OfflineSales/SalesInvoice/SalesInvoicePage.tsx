"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "../../layout/DashboardLayout";
import InvoiceHeader from "./components/InvoiceHeader";
import InvoiceListHeader from "./components/InvoiceListHeader";
import InvoiceFilters from "./components/InvoiceFilters";
import InvoiceTable from "./components/InvoiceTable";
import InvoiceMetaForm from "./components/InvoiceMetaForm";
import InvoiceItemsTable from "./components/InvoiceItemsTable";
import InvoicePartyDetails from "./components/InvoicePartyDetails";
import InvoiceSummaryFooter from "./components/InvoiceSummaryFooter";
import DeleteInvoiceModal from "./components/DeleteInvoiceModal";

import {
  SalesInvoice,
  SalesInvoiceItem,
  SalesInvoiceFormData,
  SalesInvoiceFilterState,
} from "./types/salesInvoice.types";
import { salesInvoiceService } from "./services/salesInvoice.service";
import { challanService } from "../SalesChallan/services/challan.service";
import {
  calculateItemGst,
  calculateInvoiceTotals,
  extractStateCode,
} from "./utils/gstCalculator";
import { toast } from "sonner";

function getTodayFormatted(): string {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  return `${y}-${m}-${d}`;
}

export default function SalesInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challanIdParam = searchParams.get("challanId");

  // Mode: "list" (Directory table view) | "create" (New invoice form) | "edit" (Edit invoice form)
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">(
    challanIdParam ? "create" : "list"
  );

  // List View State
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [filters, setFilters] = useState<SalesInvoiceFilterState>({
    search: "",
    invoiceNo: "",
    challanNo: "",
    challanRefNo: "",
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
  const [activeInvoice, setActiveInvoice] = useState<SalesInvoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState<SalesInvoiceFormData>({
    invoiceType: "Tax Invoice",
    invoiceNo: "",
    invoiceDate: getTodayFormatted(),
    challanId: null,
    challanNo: "",
    challanDate: "",
    partyId: null,
    partyGstn: "",
    stateCode: "24",
    brokerName: "",
    consigneeName: "",
    editOn: true,
    remarks: "",
    ewayBillNo: "",
    expenseOnSales: 0,
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

  const [items, setItems] = useState<SalesInvoiceItem[]>([]);

  // -------------------------------------------------------------
  // List View Data Fetching
  // -------------------------------------------------------------
  const fetchInvoices = useCallback(async (customFilters?: SalesInvoiceFilterState) => {
    try {
      setListLoading(true);
      const activeFilters = customFilters || filtersRef.current;
      const res = await salesInvoiceService.getInvoices(activeFilters);
      setInvoices(res.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load sales invoices.");
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
    field: keyof SalesInvoiceFilterState,
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
    const defaultFilters: SalesInvoiceFilterState = {
      search: "",
      invoiceNo: "",
      challanNo: "",
      challanRefNo: "",
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
  const handleFormChange = (fields: Partial<SalesInvoiceFormData>) => {
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

  const handleItemsChange = (newItems: SalesInvoiceItem[]) => {
    setItems(newItems);
  };

  const computedTotals = useMemo(() => {
    return calculateInvoiceTotals(
      items,
      undefined,
      formData.expenseOnSales || 0,
      formData.applyRoundOff !== false
    );
  }, [items, formData.expenseOnSales, formData.applyRoundOff]);

  const initNextInvoiceNo = async () => {
    try {
      const nextNo = await salesInvoiceService.getNextInvoiceNo();
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
    const initialItem: SalesInvoiceItem = {
      itemNo: 1,
      sku: "",
      particular: "",
      hsn: "62041200",
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
      partyId: null,
      partyGstn: "",
      stateCode: "24",
      brokerName: "",
      consigneeName: "",
      editOn: true,
      remarks: "",
      ewayBillNo: "",
      expenseOnSales: 0,
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
    const ymd = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

    const dmy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return str;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  const populateFromInvoice = (inv: SalesInvoice) => {
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
      partyId: inv.partyId || null,
      partyGstn: inv.partyGstn || "",
      stateCode: inv.stateCode || "24",
      brokerName: inv.brokerName || "",
      consigneeName: inv.consigneeName || "",
      editOn: inv.editOn ?? true,
      remarks: inv.remarks || "",
      ewayBillNo: inv.ewayBillNo || "",
      expenseOnSales: 0,
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

  // Load from Challan (when clicking Invoice icon from Sales Challan table)
  const loadChallanForInvoice = useCallback(async (challanId: string) => {
    try {
      setLoading(true);
      const existing = await salesInvoiceService.getInvoiceByChallanId(challanId);
      if (existing) {
        populateFromInvoice(existing);
        toast.info(`Opened existing Sales Invoice #${existing.invoiceNo} for this challan.`);
        return;
      }

      const res = await challanService.getChallanById(challanId);
      const ch = res.data;
      if (!ch) throw new Error("Challan not found.");

      const nextNo = await salesInvoiceService.getNextInvoiceNo();
      const challanAny = ch as any;
      const partyGstn = ch.party?.gstin || challanAny.partyGstin || "";
      const partyState = ch.party?.state || "Gujarat";
      const stateCode = extractStateCode(partyGstn, partyState);
      const isIntraState = stateCode === "24";

      const mappedItems: SalesInvoiceItem[] = (ch.items || []).map((it, idx) => {
        const qty = Number(it.quantity) || 0;
        const rate = Number(it.rate) || 0;
        const amount = Math.round(qty * rate * 100) / 100;
        const discountAmt = 0;
        const taxableAmt = amount;

        const sgstRate = isIntraState ? 2.5 : 0;
        const cgstRate = isIntraState ? 2.5 : 0;
        const igstRate = isIntraState ? 0 : 5.0;

        const sgstAmt = isIntraState ? Math.round(taxableAmt * 0.025 * 100) / 100 : 0;
        const cgstAmt = isIntraState ? Math.round(taxableAmt * 0.025 * 100) / 100 : 0;
        const igstAmt = !isIntraState ? Math.round(taxableAmt * 0.05 * 100) / 100 : 0;

        const total = Math.round((taxableAmt + sgstAmt + cgstAmt + igstAmt) * 100) / 100;

        return {
          itemNo: it.itemNo || idx + 1,
          sku: it.sku || "",
          particular: (it as any).particular || it.name || it.sku || "",
          hsn: "62041200",
          quantity: qty === 0 ? "" : qty,
          rate: rate === 0 ? "" : rate,
          amount: amount === 0 ? "" : amount,
          discountPercent: "",
          discountAmount: "",
          taxableAmount: taxableAmt === 0 ? "" : taxableAmt,
          sgstRate: sgstRate === 0 ? "" : sgstRate,
          sgstAmount: sgstAmt === 0 ? "" : sgstAmt,
          cgstRate: cgstRate === 0 ? "" : cgstRate,
          cgstAmount: cgstAmt === 0 ? "" : cgstAmt,
          igstRate: igstRate === 0 ? "" : igstRate,
          igstAmount: igstAmt === 0 ? "" : igstAmt,
          total: total === 0 ? "" : total,
        };
      });

      const partyName = ch.party?.partyName || challanAny.partyName || "";
      const partyAddress = [ch.party?.addressLine1, ch.party?.addressLine2]
        .filter(Boolean)
        .join(", ");
      const partyPhone = ch.party?.phone || ch.party?.whatsapp || "";

      setActiveInvoice(null);
      setFormData({
        invoiceType: "Tax Invoice",
        invoiceNo: nextNo,
        invoiceDate: getTodayFormatted(),
        challanId: ch.id,
        challanNo: ch.challanNo,
        challanDate: ch.challanDate || getTodayFormatted(),
        partyId: ch.partyId || null,
        partyGstn: partyGstn,
        stateCode: stateCode,
        brokerName: challanAny.brokerName || "",
        consigneeName: ch.consigneeName || "",
        editOn: true,
        remarks: challanAny.deliveryTerms || challanAny.remarks || "",
        ewayBillNo: challanAny.ewayBillNo || "",
        expenseOnSales: 0,
        hasReceipt: false,
        receivedAmount: 0,
        receiptMode: "Select Mode",
        receiptAccount: "",
        transactionType: "Cheque",
        transactionDate: getTodayFormatted(),
        chequeNo: "",
        bankName: "",
        applyRoundOff: true,
        billingPartyName: partyName,
        billingAddress: partyAddress,
        billingCity: ch.party?.city || "",
        billingState: partyState,
        billingPincode: ch.party?.pincode || "",
        billingEmail: ch.party?.email || "",
        billingMobile: partyPhone,
        shippingPartyName: partyName,
        shippingAddress: ch.party?.shippingAddress1 || partyAddress,
        shippingAddress2: ch.party?.shippingAddress2 || "",
        shippingCity: ch.party?.shippingCity || ch.party?.city || "",
        shippingState: ch.party?.shippingState || partyState,
        shippingPincode: ch.party?.shippingPincode || ch.party?.pincode || "",
        shippingContact: ch.party?.shippingPhone || partyPhone,
        courierPartner: challanAny.courierPartner || "",
        trackingNo: challanAny.trackingNo || "",
        items: mappedItems,
      });

      setItems(mappedItems);
      setViewMode("create");
      toast.success(`Pre-filled Sales Invoice from Challan #${ch.challanNo}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load challan details.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (challanIdParam) {
      loadChallanForInvoice(challanIdParam);
    } else {
      setViewMode("list");
      fetchInvoices();
    }
  }, [challanIdParam, loadChallanForInvoice, fetchInvoices]);

  // Handle Save
  const handleSave = async () => {
    if (!formData.billingPartyName?.trim()) {
      toast.error("Please enter or select a Party Name for Billing.");
      return;
    }

    if (!formData.invoiceNo?.trim()) {
      toast.error("Please enter a valid Invoice Number.");
      return;
    }

    if (items.length === 0) {
      toast.error("Invoice must have at least one line item.");
      return;
    }

    try {
      setSaving(true);
      const sanitizedItems = items.map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        amount: Number(it.amount) || 0,
        discountPercent: Number(it.discountPercent) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        taxableAmount: Number(it.taxableAmount) || 0,
        sgstRate: Number(it.sgstRate) || 0,
        sgstAmount: Number(it.sgstAmount) || 0,
        cgstRate: Number(it.cgstRate) || 0,
        cgstAmount: Number(it.cgstAmount) || 0,
        igstRate: Number(it.igstRate) || 0,
        igstAmount: Number(it.igstAmount) || 0,
        total: Number(it.total) || 0,
      }));

      const payload: SalesInvoiceFormData = {
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
        totalQuantity: computedTotals.totalQuantity,
        totalAmount: computedTotals.totalAmount,
        totalDiscount: computedTotals.totalDiscount,
        amountBeforeTax: computedTotals.amountBeforeTax,
        sgstAmount: computedTotals.sgstAmount,
        cgstAmount: computedTotals.cgstAmount,
        igstAmount: computedTotals.igstAmount,
        totalGst: computedTotals.totalGst,
        amountAfterTax: computedTotals.amountAfterTax,
        roundOff: computedTotals.roundOff,
        netAmount: computedTotals.netAmount,
        items: sanitizedItems,
      };

      if (activeInvoice && activeInvoice.id) {
        // Update existing invoice
        const updated = await salesInvoiceService.updateInvoice(activeInvoice.id, payload);
        setActiveInvoice(updated);
        toast.success(`Sales Invoice #${updated.invoiceNo} updated successfully!`);
      } else {
        // Create new invoice
        const created = await salesInvoiceService.createInvoice(payload);
        setActiveInvoice(created);
        toast.success(`Sales Invoice #${created.invoiceNo} saved successfully!`);
      }

      // Return to List View after successful save
      setViewMode("list");
      fetchInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save sales invoice.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    const target = deletingInvoice || activeInvoice;
    if (!target || !target.id) return;

    try {
      setDeleting(true);
      await salesInvoiceService.deleteInvoice(target.id);
      toast.success(`Sales Invoice #${target.invoiceNo} deleted.`);
      setDeleteModalOpen(false);
      setDeletingInvoice(null);
      setActiveInvoice(null);
      setViewMode("list");
      fetchInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete sales invoice.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setActiveInvoice(null);
    fetchInvoices();
  };

  // Downloads
  const handleDownloadDetail = async () => {
    try {
      if (viewMode !== "list") {
        await salesInvoiceService.downloadSingleInvoiceDetail(formData, items);
        toast.success(`Downloaded Sales Invoice #${formData.invoiceNo || ""} Detail Excel`);
      } else {
        const downloadFilters =
          selectedInvoiceIds.length > 0
            ? { ...filters, ids: selectedInvoiceIds.join(",") }
            : filters;
        await salesInvoiceService.downloadDetail(downloadFilters);
        toast.success(
          selectedInvoiceIds.length > 0
            ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) Detail Excel`
            : "Downloaded Invoices Detail Excel"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed.");
    }
  };

  const handleDownloadAll = async () => {
    try {
      if (selectedInvoiceIds.length > 0) {
        const selectedInvoices = invoices.filter((inv) =>
          selectedInvoiceIds.includes(inv.id)
        );
        await salesInvoiceService.downloadInvoicesTableExcel(selectedInvoices);
        toast.success(
          `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) Excel`
        );
      } else {
        await salesInvoiceService.downloadInvoicesTableExcel(invoices);
        toast.success("Downloaded Invoices Excel");
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed.");
    }
  };

  const handleDownloadSkuWise = async () => {
    try {
      if (viewMode !== "list") {
        await salesInvoiceService.downloadSingleInvoiceSkuWise(formData, items);
        toast.success(`Downloaded Sales Invoice #${formData.invoiceNo || ""} SKU Wise Excel`);
      } else {
        const downloadFilters =
          selectedInvoiceIds.length > 0
            ? { ...filters, ids: selectedInvoiceIds.join(",") }
            : filters;
        await salesInvoiceService.downloadSkuWise(downloadFilters);
        toast.success(
          selectedInvoiceIds.length > 0
            ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) SKU Wise Excel`
            : "Downloaded SKU Wise Excel"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed.");
    }
  };

  const handleDownloadTally = async () => {
    try {
      if (viewMode !== "list") {
        await salesInvoiceService.downloadSingleInvoiceTally(formData, items);
        toast.success(`Downloaded Sales Invoice #${formData.invoiceNo || ""} Tally Excel`);
      } else {
        const downloadFilters =
          selectedInvoiceIds.length > 0
            ? { ...filters, ids: selectedInvoiceIds.join(",") }
            : filters;
        await salesInvoiceService.downloadTally(downloadFilters);
        toast.success(
          selectedInvoiceIds.length > 0
            ? `Downloaded ${selectedInvoiceIds.length} Selected Invoice(s) Tally Excel`
            : "Downloaded Tally Excel"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed.");
    }
  };

  return (
    <DashboardLayout title="Sales Invoice">
      <div className="space-y-4 sm:space-y-5 pb-12 max-w-[1700px] mx-auto">
        {/* ========================================================= */}
        {/* VIEW MODE: LIST / DIRECTORY TABLE */}
        {/* ========================================================= */}
        {viewMode === "list" ? (
          <>
            <InvoiceListHeader
              onAddNew={handleResetToNew}
              onDownloadDetail={handleDownloadDetail}
              onDownloadAll={handleDownloadAll}
              onDownloadSummary={handleDownloadAll}
              onDownloadSkuWise={handleDownloadSkuWise}
              onDownloadTally={handleDownloadTally}
              onCloseInvoice={() => router.push("/dashboard/offline-sales/sales-challan")}
            />

            <InvoiceFilters
              filters={filters}
              onChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onSearch={handleFilterSearch}
              onReset={handleFilterReset}
            />

            <InvoiceTable
              invoices={invoices}
              loading={listLoading}
              selectedIds={selectedInvoiceIds}
              onSelectionChange={setSelectedInvoiceIds}
              onView={(inv) => populateFromInvoice(inv)}
              onEdit={(inv) => populateFromInvoice(inv)}
              onDelete={(inv) => {
                setDeletingInvoice(inv);
                setDeleteModalOpen(true);
              }}
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
          /* ========================================================= */
          /* VIEW MODE: CREATE / EDIT INVOICE FORM */
          /* ========================================================= */
          <>
            <InvoiceHeader
              invoiceNo={formData.invoiceNo}
              isExisting={Boolean(activeInvoice && activeInvoice.id)}
              saving={saving}
              deleting={deleting}
              onSave={handleSave}
              onDelete={() => {
                setDeletingInvoice(activeInvoice);
                setDeleteModalOpen(true);
              }}
              onBack={handleBackToList}
              onDownloadDetail={handleDownloadDetail}
              onDownloadSkuWise={handleDownloadSkuWise}
              onDownloadTally={handleDownloadTally}
            />

            {loading ? (
              <div className="rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
                <p className="text-sm font-semibold text-slate-500 animate-pulse">
                  Loading sales invoice and challan details...
                </p>
              </div>
            ) : (
              <>
                {/* Top Metadata Fields Bar */}
                <InvoiceMetaForm
                  formData={formData}
                  onChange={handleFormChange}
                  disabled={!formData.editOn}
                />

                {/* Main Center Area: Left Items + Right Party Details */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
                  {/* Left Column: Items Table + Summary Footer */}
                  <div className="xl:col-span-8 2xl:col-span-9 space-y-4 sm:space-y-5">
                    <InvoiceItemsTable
                      items={items}
                      onChange={handleItemsChange}
                      partyStateCode={formData.stateCode || "24"}
                      disabled={!formData.editOn}
                    />

                    <InvoiceSummaryFooter
                      formData={formData}
                      onChange={handleFormChange}
                      computedTotals={computedTotals}
                      disabled={!formData.editOn}
                    />
                  </div>

                  {/* Right Column: Party Details Cards */}
                  <div className="xl:col-span-4 2xl:col-span-3 sticky top-4">
                    <InvoicePartyDetails
                      formData={formData}
                      onChange={handleFormChange}
                      disabled={!formData.editOn}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteInvoiceModal
          isOpen={deleteModalOpen}
          invoiceNo={
            deletingInvoice?.invoiceNo || activeInvoice?.invoiceNo || formData.invoiceNo || ""
          }
          isDeleting={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingInvoice(null);
          }}
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
