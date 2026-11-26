"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Eye,
  Plus,
  Trash2,
  Calendar,
  Check,
  ClipboardList,
  Save,
  ArrowLeft,
  X,
  FileText,
  Download,
  Upload,
} from "lucide-react";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrentUserName } from "@/utils/auth";
import DownloadDropdown, { DownloadOption } from "@/components/ui/DownloadDropdown";
import PartyDetailsPendingChallansDrawer, {
  PendingChallan,
} from "./PartyDetailsPendingChallansDrawer";
import {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseInvoiceFormData,
} from "../types/purchaseInvoice.types";
import { Party } from "@/components/Dashboard/Purchase/PurchaseChallan/types/purchaseChallan.types";
import { purchaseInvoiceService } from "../services/purchaseInvoice.service";
import { purchaseChallanService } from "@/components/Dashboard/Purchase/PurchaseChallan/services/purchaseChallan.service";
import {
  calculateItemGst,
  calculateInvoiceTotals,
  extractStateCode,
} from "../utils/purchaseGstCalculator";
import {
  downloadPurchaseBlankFormatExcel,
  parsePurchaseItemsFromExcel,
} from "@/components/Dashboard/Purchase/PurchaseChallan/utils/purchaseExcelHelper";
import { toast } from "sonner";

interface PurchaseInvoiceCreateFormProps {
  invoice?: PurchaseInvoice | null;
  initialChallanId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  onDownloadDetail?: () => void;
  onDownloadSkuWise?: () => void;
  onDownloadTally?: () => void;
}

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "Purchase Voucher", label: "Purchase Voucher" },
];

const brokerOptions: ThemeSelectOption[] = [
  { value: "", label: "Select Agent / Broker" },
  { value: "Direct", label: "Direct" },
  { value: "Ramesh Bhai", label: "Ramesh Bhai" },
  { value: "Suresh Bhai", label: "Suresh Bhai" },
];

export default function PurchaseInvoiceCreateForm({
  invoice,
  initialChallanId,
  onSuccess,
  onCancel,
  onDelete,
  onDownloadDetail,
  onDownloadSkuWise,
  onDownloadTally,
}: PurchaseInvoiceCreateFormProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Header & Meta Bar State
  const [invoiceType, setInvoiceType] = useState(invoice?.invoiceType || "Tax Invoice");
  const [partyBillNo, setPartyBillNo] = useState(
    invoice?.challan?.partyChallanNo || invoice?.challanNo || ""
  );
  const [invoiceNo, setInvoiceNo] = useState(invoice?.invoiceNo || "");
  const [invoiceDate, setInvoiceDate] = useState(
    invoice?.invoiceDate
      ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
      : todayStr
  );

  // Supplier & Slide-over Drawer State
  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(
    invoice?.supplier || null
  );
  // Drawer automatically opens when creating new invoice with sider visible
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!invoice?.id && !initialChallanId) {
      const timer = setTimeout(() => {
        setIsDrawerOpen(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [invoice?.id, initialChallanId]);

  // Bottom Metadata
  const [brokerName, setBrokerName] = useState(invoice?.brokerName || "");
  const [consigneeName, setConsigneeName] = useState(invoice?.consigneeName || "");
  const [remarks, setRemarks] = useState(invoice?.remarks || "");
  const [preparedBy, setPreparedBy] = useState<string>(
    (invoice as any)?.preparedBy || ""
  );

  useEffect(() => {
    if (!(invoice as any)?.preparedBy) {
      setPreparedBy((prev) => prev || getCurrentUserName());
    }
  }, [(invoice as any)?.preparedBy]);

  // Summary state (TDS %, TCS %, Other Expense, Round Off)
  const [tdsPercent, setTdsPercent] = useState<number>(0);
  const [tcsPercent, setTcsPercent] = useState<number>(0);
  const [otherExpense, setOtherExpense] = useState<number>(
    Number(invoice?.expenseOnPurchase) || 0
  );
  const [customRoundOff, setCustomRoundOff] = useState<number | undefined>(
    invoice?.roundOff !== undefined ? invoice.roundOff : undefined
  );

  const [isSaving, setIsSaving] = useState(false);

  // Items state
  const initialBlankItem: PurchaseInvoiceItem = {
    itemNo: 1,
    sku: "",
    particular: "",
    size: "",
    hsn: "5208",
    quantity: 0,
    rate: 0,
    amount: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    sgstRate: 2.5,
    sgstAmount: 0,
    cgstRate: 2.5,
    cgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    total: 0,
  };

  const [items, setItems] = useState<PurchaseInvoiceItem[]>(
    invoice?.items && invoice.items.length > 0
      ? invoice.items.map((it, idx) => ({
        ...it,
        itemNo: it.itemNo || idx + 1,
        size: it.size || "",
        hsn: it.hsn !== undefined && it.hsn !== null ? it.hsn : "",
      }))
      : [initialBlankItem]
  );

  // Fetch next invoice number if creating new
  useEffect(() => {
    if (!invoice?.id) {
      purchaseInvoiceService
        .getNextInvoiceNo()
        .then((nextNo) => {
          if (nextNo) setInvoiceNo(nextNo);
        })
        .catch(() => setInvoiceNo("1"));
    }
  }, [invoice?.id]);

  // If initialChallanId was passed in query, fetch that challan and prepopulate
  useEffect(() => {
    if (initialChallanId && !invoice) {
      purchaseChallanService
        .getChallanById(initialChallanId)
        .then((res) => {
          const ch = res?.data;
          if (ch) {
            if (ch.supplier) {
              setSelectedSupplier(ch.supplier);
            } else if (ch.supplierName) {
              setSelectedSupplier({
                id: ch.supplierId || "temp",
                partyName: ch.supplierName,
                phone: ch.contactNo || "",
                state: "Gujarat",
              } as any);
            }

            if (ch.challanNo) setPartyBillNo(ch.challanNo);
            if (ch.preparedBy) setPreparedBy(ch.preparedBy);
            if (ch.remarks) setRemarks(ch.remarks);

            const pGst = ch.supplier?.gstin || (ch as any).supplierGstin || "";
            const pState = ch.supplier?.state || "Gujarat";
            const pStateCode = extractStateCode(pGst, pState);

            if (ch.items && ch.items.length > 0) {
              const mapped: PurchaseInvoiceItem[] = ch.items.map((it: any, idx: number) => {
                const qty = Number(it.receivedQty) || Number(it.orderedQty) || 1;
                const rate = Number(it.rate) || 0;
                const amt = Number(it.amount) || Math.round(qty * rate * 100) / 100;
                const baseItem: Partial<PurchaseInvoiceItem> = {
                  sku: it.sku || "",
                  particular: it.particular || it.name || it.sku || "",
                  size: it.size || "",
                  hsn: it.hsn || "5208",
                  quantity: qty,
                  rate: rate,
                  amount: amt,
                  discountPercent: 0,
                  discountAmount: 0,
                  taxableAmount: amt,
                  sgstRate: 2.5,
                  cgstRate: 2.5,
                  igstRate: 0,
                };
                const calculated = calculateItemGst(baseItem, "24", pStateCode);
                return {
                  ...calculated,
                  itemNo: idx + 1,
                  size: it.size || "",
                  hsn: it.hsn || "5208",
                };
              });
              setItems(mapped);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load purchase challan for invoice:", err);
        });
    }
  }, [initialChallanId, invoice]);

  // State code of supplier
  const supplierStateCode = useMemo(() => {
    if (!selectedSupplier) return "";
    return extractStateCode(selectedSupplier?.gstin, selectedSupplier?.state);
  }, [selectedSupplier]);

  // Item change handler with recalculation
  const handleItemFieldChange = (
    index: number,
    field: keyof PurchaseInvoiceItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Compute item GST
      const recalculated = calculateItemGst(target, "24", supplierStateCode);
      updated[index] = {
        ...recalculated,
        itemNo: index + 1,
        size: target.size,
        hsn: target.hsn !== undefined && target.hsn !== null ? target.hsn : "",
      };
      return updated;
    });
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        ...initialBlankItem,
        itemNo: prev.length + 1,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) {
      setItems([{ ...initialBlankItem, itemNo: 1 }]);
      return;
    }
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((it, idx) => ({ ...it, itemNo: idx + 1 }))
    );
  };

  // Import pending challans items into invoice items table
  const handleImportPendingChallans = (challans: PendingChallan[]) => {
    const importedRows: PurchaseInvoiceItem[] = [];
    const challanNumbers: string[] = [];

    challans.forEach((ch) => {
      if (ch.challanNo) challanNumbers.push(ch.challanNo);
      (ch.items || []).forEach((it) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.rate) || 0;
        const amt = Math.round(qty * rate * 100) / 100;
        const baseItem: Partial<PurchaseInvoiceItem> = {
          sku: it.sku,
          particular: it.particular || it.sku,
          size: it.size || "",
          hsn: "5208",
          quantity: qty,
          rate: rate,
          amount: amt,
          discountPercent: 0,
          discountAmount: 0,
          taxableAmount: amt,
          sgstRate: 2.5,
          cgstRate: 2.5,
          igstRate: 0,
        };
        const calculated = calculateItemGst(baseItem, "24", supplierStateCode);
        importedRows.push({
          ...calculated,
          itemNo: importedRows.length + 1,
          size: it.size || "",
          lotNo: it.lotNo || "",
          hsn: "5208",
        });
      });
    });

    if (importedRows.length > 0) {
      setItems(importedRows.map((r, i) => ({ ...r, itemNo: i + 1 })));
      if (challanNumbers.length > 0) {
        setPartyBillNo(challanNumbers.join(", "));
      }
    }
  };

  // Excel import for Invoice items table
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parsePurchaseItemsFromExcel(file);
      if (parsed.length > 0) {
        const importedRows: PurchaseInvoiceItem[] = parsed.map((it, idx) => {
          const qty = Number(it.receivedQty || it.orderedQty) || 1;
          const rate = Number(it.rate) || 0;
          const amt = Math.round(qty * rate * 100) / 100;
          const baseItem: Partial<PurchaseInvoiceItem> = {
            sku: it.sku,
            particular: it.name || it.sku,
            size: it.size || "",
            hsn: "5208",
            quantity: qty,
            rate: rate,
            amount: amt,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: amt,
            sgstRate: 2.5,
            cgstRate: 2.5,
            igstRate: 0,
          };
          const calculated = calculateItemGst(baseItem, "24", supplierStateCode);
          return {
            ...calculated,
            itemNo: idx + 1,
            size: it.size || "",
            lotNo: it.lotNo || "",
            hsn: "5208",
          };
        });
        setItems(importedRows);
        toast.success(`Imported ${importedRows.length} items from Excel.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to import excel");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Base totals
  const baseTotals = useMemo(() => {
    return calculateInvoiceTotals(items, customRoundOff, otherExpense, true);
  }, [items, customRoundOff, otherExpense]);

  // TDS and TCS amounts
  const tdsAmount = useMemo(() => {
    return Math.round(baseTotals.amountBeforeTax * (Number(tdsPercent || 0) / 100) * 100) / 100;
  }, [baseTotals.amountBeforeTax, tdsPercent]);

  const tcsAmount = useMemo(() => {
    return Math.round(baseTotals.amountBeforeTax * (Number(tcsPercent || 0) / 100) * 100) / 100;
  }, [baseTotals.amountBeforeTax, tcsPercent]);

  // Final net amount with TDS, TCS, Other Expense, Round Off
  const finalNetAmount = useMemo(() => {
    const afterTaxWithExpenses =
      baseTotals.amountAfterTax + Number(otherExpense || 0) + tcsAmount - tdsAmount;
    const rounded = Math.round(afterTaxWithExpenses);
    const roundOffVal =
      customRoundOff !== undefined
        ? customRoundOff
        : Math.round((rounded - afterTaxWithExpenses) * 100) / 100;
    return Math.round((afterTaxWithExpenses + roundOffVal) * 100) / 100;
  }, [baseTotals.amountAfterTax, otherExpense, tcsAmount, tdsAmount, customRoundOff]);

  const effectiveRoundOff = useMemo(() => {
    if (customRoundOff !== undefined) return customRoundOff;
    const afterTaxWithExpenses =
      baseTotals.amountAfterTax + Number(otherExpense || 0) + tcsAmount - tdsAmount;
    return Math.round((Math.round(afterTaxWithExpenses) - afterTaxWithExpenses) * 100) / 100;
  }, [baseTotals.amountAfterTax, otherExpense, tcsAmount, tdsAmount, customRoundOff]);

  // Submit invoice
  const handleSubmit = async () => {
    if (!selectedSupplier) {
      toast.error("Please click 'Select Party' to choose a Creditor Supplier.");
      setIsDrawerOpen(true);
      return;
    }

    const validItems = items.filter((it) => it.sku && it.sku.trim().length > 0);
    if (validItems.length === 0) {
      toast.error("At least one product item with SKU is required.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: PurchaseInvoiceFormData = {
        invoiceType,
        invoiceNo,
        invoiceDate,
        challanId: invoice?.challanId || initialChallanId || undefined,
        challanNo: partyBillNo || undefined,
        supplierId: selectedSupplier.id !== "temp" ? selectedSupplier.id : undefined,
        partyId: selectedSupplier.id !== "temp" ? selectedSupplier.id : undefined,
        partyGstn: selectedSupplier.gstin || undefined,
        stateCode: supplierStateCode,
        brokerName: brokerName || undefined,
        consigneeName: consigneeName || undefined,
        remarks: remarks || undefined,
        expenseOnPurchase: otherExpense,
        hasReceipt: false,
        editOn: true,
        billingPartyName: selectedSupplier.partyName,
        billingAddress:
          (selectedSupplier as any).address1 ||
          selectedSupplier.addressLine1 ||
          undefined,
        billingCity: selectedSupplier.city || undefined,
        billingState: selectedSupplier.state || "Gujarat",
        billingPincode: selectedSupplier.pincode || undefined,
        billingMobile: selectedSupplier.phone || undefined,
        totalQuantity: baseTotals.totalQuantity,
        totalAmount: baseTotals.totalAmount,
        totalDiscount: baseTotals.totalDiscount,
        amountBeforeTax: baseTotals.amountBeforeTax,
        sgstAmount: baseTotals.sgstAmount,
        cgstAmount: baseTotals.cgstAmount,
        igstAmount: baseTotals.igstAmount,
        totalGst: baseTotals.totalGst,
        amountAfterTax: baseTotals.amountAfterTax,
        roundOff: effectiveRoundOff,
        netAmount: finalNetAmount,
        items: validItems.map((it, idx) => ({
          ...it,
          itemNo: idx + 1,
          particular: it.particular || it.sku,
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
        })),
      };

      if (invoice?.id) {
        await purchaseInvoiceService.updateInvoice(invoice.id, payload);
        toast.success(`Purchase Invoice ${invoiceNo} updated successfully!`);
      } else {
        await purchaseInvoiceService.createInvoice(payload);
        toast.success(`Purchase Invoice ${invoiceNo} created successfully!`);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save purchase invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const buildCurrentFormData = (): PurchaseInvoiceFormData => {
    return {
      invoiceType,
      invoiceNo,
      invoiceDate,
      challanId: invoice?.challanId || initialChallanId || null,
      challanNo: partyBillNo || invoice?.challanNo || null,
      partyId: selectedSupplier && selectedSupplier.id !== "temp" ? selectedSupplier.id : invoice?.supplierId || null,
      supplierId: selectedSupplier && selectedSupplier.id !== "temp" ? selectedSupplier.id : invoice?.supplierId || null,
      partyGstn: selectedSupplier?.gstin || invoice?.partyGstn || null,
      stateCode: supplierStateCode || invoice?.stateCode || null,
      brokerName: brokerName || null,
      consigneeName: consigneeName || null,
      editOn: false,
      remarks: remarks || null,
      ewayBillNo: invoice?.ewayBillNo || null,
      expenseOnPurchase: otherExpense || 0,
      hasReceipt: false,
      billingPartyName: selectedSupplier?.partyName || invoice?.billingPartyName || "",
      billingAddress: selectedSupplier?.addressLine1 || invoice?.billingAddress || null,
      billingCity: selectedSupplier?.city || invoice?.billingCity || null,
      billingState: selectedSupplier?.state || invoice?.billingState || null,
      billingPincode: selectedSupplier?.pincode || invoice?.billingPincode || null,
      billingMobile: selectedSupplier?.phone || invoice?.billingMobile || null,
      totalQuantity: baseTotals.totalQuantity,
      totalAmount: baseTotals.totalAmount,
      totalDiscount: baseTotals.totalDiscount,
      amountBeforeTax: baseTotals.amountBeforeTax,
      sgstAmount: baseTotals.sgstAmount,
      cgstAmount: baseTotals.cgstAmount,
      igstAmount: baseTotals.igstAmount,
      totalGst: baseTotals.totalGst,
      amountAfterTax: baseTotals.amountAfterTax,
      roundOff: effectiveRoundOff,
      netAmount: finalNetAmount,
      status: invoice?.status || "Generated",
      createdAt: invoice?.createdAt || todayStr,
      updatedAt: todayStr,
      items: items,
    } as any;
  };

  const handleDownloadDetailInternal = async () => {
    try {
      if (onDownloadDetail) {
        onDownloadDetail();
      } else {
        await purchaseInvoiceService.downloadSingleInvoiceDetail(buildCurrentFormData(), items);
        toast.success(`Downloaded Purchase Invoice #${invoiceNo} Detail Excel`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download detail excel");
    }
  };

  const handleDownloadSkuWiseInternal = async () => {
    try {
      if (onDownloadSkuWise) {
        onDownloadSkuWise();
      } else {
        await purchaseInvoiceService.downloadSingleInvoiceSkuWise(buildCurrentFormData(), items);
        toast.success(`Downloaded Purchase Invoice #${invoiceNo} SKU Wise Excel`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download SKU wise excel");
    }
  };

  const handleDownloadTallyInternal = async () => {
    try {
      if (onDownloadTally) {
        onDownloadTally();
      } else {
        await purchaseInvoiceService.downloadSingleInvoiceTally(buildCurrentFormData(), items);
        toast.success(`Downloaded Purchase Invoice #${invoiceNo} Tally Excel`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download Tally excel");
    }
  };

  const downloadOptions: DownloadOption[] = [
    {
      id: "detail",
      label: "Download Detail",
      onClick: handleDownloadDetailInternal,
    },
    {
      id: "sku-wise",
      label: "Download SKU Wise",
      onClick: handleDownloadSkuWiseInternal,
    },
    {
      id: "tally",
      label: "Download [Tally]",
      onClick: handleDownloadTallyInternal,
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Top Header Bar matching user's Image 2 */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Icon, Title & Breadcrumb */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                  Purchase Invoice
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1A160E] text-[#E8C16D] border border-[#E8C16D]/60 shadow-2xs">
                  #{invoice?.invoiceNo || invoiceNo || "1"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                Purchase / Finish Goods • Purchase Invoice
              </p>
            </div>
          </div>

          {/* Right: Action Buttons matching Image 2 */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Action Button: Back to List */}
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/20 active:scale-[0.98] cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Back to List</span>
            </button>

            {/* Download Dropdown */}
            <DownloadDropdown
              options={downloadOptions}
              label="Download"
              className="min-h-[40px]"
            />

            {/* Action Button: Save Invoice */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-md hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] shrink-0 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Invoice"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Top Filter / Meta Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left side: Invoice Type, Party Bill No, Date */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Invoice Type */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Invoice Type
              </label>
              <div className="w-36 sm:w-40">
                <ThemeSelectDropdown
                  value={invoiceType}
                  onChange={setInvoiceType}
                  options={invoiceTypeOptions}
                  buttonClassName="h-9 sm:h-10 px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            {/* OC Invoice No matching Image 2 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                OC Invoice No
              </label>
              <input
                type="text"
                value={invoiceNo}
                readOnly
                placeholder="1"
                className="h-9 sm:h-10 w-24 sm:w-28 px-3 text-xs sm:text-sm font-bold bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] rounded-xl sm:rounded-2xl text-[#B88728] dark:text-[#E8C16D] outline-none font-mono text-center shadow-2xs cursor-default select-all"
                title="Invoice No (Auto-generated)"
              />
            </div>

            {/* Party Bill No / OC Challan No */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                OC Challan No
              </label>
              <input
                type="text"
                value={partyBillNo}
                readOnly
                placeholder="Challan No"
                className="h-9 sm:h-10 w-32 sm:w-36 px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none shadow-2xs font-mono cursor-default select-all"
                title="Challan No (Linked from Challan)"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Date
              </label>
              <div className="w-32 sm:w-36">
                <DatePicker
                  allowInput
                  value={invoiceDate}
                  onChange={(_, dateStr) => setInvoiceDate(dateStr || todayStr)}
                  placeholder="YYYY-MM-DD"
                  dateFormat="yyyy-MM-dd"
                  className="w-full"
                  buttonClassName="h-9 sm:h-10 px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Right side: [ 👁️ DHARMA POLY PLAST ] [ 24 ] - [ 24CAGPB1419N1ZW ] */}
          <div className="flex items-center gap-2.5 ml-auto shrink-0 flex-wrap">
            {/* Select Party Button with Eye Icon matching light & dark theme */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={`inline-flex items-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-tight transition-all shadow-xs cursor-pointer border active:scale-[0.98] ${selectedSupplier
                ? "border-[#E8C16D] dark:border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] ring-2 ring-[#E8C16D]/20 hover:bg-[#FFF3D6] dark:hover:bg-[#262014]"
                : "border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014]"
                }`}
              title={selectedSupplier ? `Selected: ${selectedSupplier.partyName}` : "Click to select party"}
            >
              <Eye className="w-4 h-4 shrink-0 text-[#B88728] dark:text-[#E8C16D] stroke-[2.2]" />
              <span className="truncate max-w-[220px]">
                {selectedSupplier?.partyName ? selectedSupplier.partyName : "Select Party"}
              </span>
            </button>

            {/* State Code Pill Box - Shows '-' when no party is selected */}
            <div
              onClick={() => setIsDrawerOpen(true)}
              className="h-8 sm:h-9 min-w-[36px] px-3 rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#0B0E14] text-xs sm:text-sm font-bold font-mono text-slate-700 dark:text-white flex items-center justify-center shadow-2xs cursor-pointer hover:border-[#E8C16D]/50 transition-colors"
              title="Party State Code (Click to open party drawer)"
            >
              {selectedSupplier && supplierStateCode ? supplierStateCode : "—"}
            </div>

            {/* Dash separator */}
            <span className="text-slate-400 font-bold px-0.5 select-none">-</span>

            {/* GSTIN Pill Box - Shows '-' when no party is selected */}
            <div
              onClick={() => setIsDrawerOpen(true)}
              className="h-8 sm:h-9 min-w-[140px] px-4 sm:px-5 rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#0B0E14] text-xs sm:text-sm font-bold font-mono text-slate-700 dark:text-white flex items-center justify-center truncate shadow-2xs cursor-pointer hover:border-[#E8C16D]/50 transition-colors"
              title={selectedSupplier?.gstin ? `GSTIN: ${selectedSupplier.gstin}` : "Party GSTIN (Click to open party drawer)"}
            >
              {selectedSupplier?.gstin ? selectedSupplier.gstin : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Drawer Scope Container - Scoped below Top Header and Meta Card (Matching User Image 2 Red Box) */}
      <div className="space-y-4 relative min-h-[580px] sm:min-h-[640px] overflow-x-clip">
        {/* 3. Items Table Card matching Image 2 */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0A0E1A] p-3.5 sm:p-5 shadow-sm space-y-3.5">
          {/* Top action toolbar (Invoice Details title + Download template + Import) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Invoice Details
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadPurchaseBlankFormatExcel}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-[#E8C16D] dark:border-[#E8C16D]/60 bg-transparent text-[#B88728] dark:text-[#E8C16D] hover:bg-[#E8C16D]/10 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Download Template</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#141B2D] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1E293B] text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Import from Excelsheet</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Main Items Table matching user uploaded image */}
          <div className="overflow-x-auto rounded-2xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#080B11] shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] font-bold text-xs select-none whitespace-nowrap">
                  <th className="py-2.5 px-2 text-center w-10 border-r border-[#F5E6BE] dark:border-white/[0.08]">No.</th>
                  <th className="py-2.5 px-2 min-w-[170px] border-r border-[#F5E6BE] dark:border-white/[0.08]">Product.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE] dark:border-white/[0.08]">Size.</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE] dark:border-white/[0.08]">HSN Code.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE] dark:border-white/[0.08]">Qty.</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE] dark:border-white/[0.08]">Rate.</th>
                  <th className="py-2.5 px-1 text-center w-24 border-r border-[#F5E6BE] dark:border-white/[0.08]">Amt.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE] dark:border-white/[0.08]">Disc %.</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE] dark:border-white/[0.08]">Disc Amt.</th>
                  <th className="py-2.5 px-1 text-center w-24 border-r border-[#F5E6BE] dark:border-white/[0.08]">Taxable Amt.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE] dark:border-white/[0.08]">SGST %.</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE] dark:border-white/[0.08]">SGST Amt.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE] dark:border-white/[0.08]">CGST %.</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE] dark:border-white/[0.08]">CGST Amt.</th>
                  <th className="py-2.5 px-2 text-center w-24 border-r border-[#F5E6BE] dark:border-white/[0.08]">Net Amt.</th>
                  <th className="py-2.5 px-1 text-center w-10">Del.</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  /* Empty state */
                  <tr>
                    <td colSpan={16} className="py-16 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-14 rounded-lg border-2 border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/[0.04] flex flex-col items-center justify-center p-2 shadow-2xs">
                          <div className="w-5 h-1.5 bg-amber-500 rounded-xs mb-1.5" />
                          <div className="w-full space-y-1">
                            <div className="h-1 bg-slate-300 dark:bg-white/20 rounded-full w-full" />
                            <div className="h-1 bg-slate-300 dark:bg-white/20 rounded-full w-3/4" />
                            <div className="h-1 bg-slate-300 dark:bg-white/20 rounded-full w-1/2" />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          No data available
                        </p>
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#B88728] dark:text-[#E8C16D] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Item</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#F5E6BE]/60 dark:border-white/[0.06] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* 1. No. */}
                      <td className="py-2 px-2 text-center text-slate-700 dark:text-slate-200 font-bold text-xs border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {index + 1}
                      </td>

                      {/* 2. Product. */}
                      <td className="py-1.5 px-2 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) =>
                            handleItemFieldChange(index, "sku", e.target.value)
                          }
                          placeholder="Particular / SKU"
                          className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none font-mono"
                        />
                      </td>

                      {/* 3. Size. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="text"
                          value={item.size || ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "size", e.target.value)
                          }
                          placeholder="Size"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
                        />
                      </td>

                      {/* 4. HSN Code. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="text"
                          value={item.hsn ?? ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "hsn", e.target.value)
                          }
                          placeholder="HSN"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none font-mono"
                        />
                      </td>

                      {/* 5. Qty. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "quantity", e.target.value)
                          }
                          placeholder="0"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 6. Rate. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate || ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "rate", e.target.value)
                          }
                          placeholder="0.00"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 7. Amt. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <div className="w-full h-8 px-2 flex items-center justify-center text-xs font-mono font-semibold rounded-xl bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white whitespace-nowrap">
                          {Number(item.amount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* 8. Disc %. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "discountPercent", e.target.value)
                          }
                          placeholder="0"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 9. Disc Amt. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <div className="w-full h-8 px-1 flex items-center justify-center text-xs font-mono font-semibold rounded-xl bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white whitespace-nowrap">
                          {Number(item.discountAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* 10. Taxable Amt. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <div className="w-full h-8 px-2 flex items-center justify-center text-xs font-mono font-semibold rounded-xl bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white whitespace-nowrap">
                          {Number(item.taxableAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* 11. SGST %. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.sgstRate !== undefined && item.sgstRate !== null ? item.sgstRate : ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "sgstRate", e.target.value)
                          }
                          placeholder="0"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-mono font-semibold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 12. SGST Amt. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <div className="w-full h-8 px-1.5 flex items-center justify-center text-xs font-mono font-semibold rounded-xl bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white whitespace-nowrap">
                          {Number(item.sgstAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* 13. CGST %. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.cgstRate !== undefined && item.cgstRate !== null ? item.cgstRate : ""}
                          onChange={(e) =>
                            handleItemFieldChange(index, "cgstRate", e.target.value)
                          }
                          placeholder="0"
                          className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-mono font-semibold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 14. CGST Amt. */}
                      <td className="py-1.5 px-1 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <div className="w-full h-8 px-1.5 flex items-center justify-center text-xs font-mono font-semibold rounded-xl bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white whitespace-nowrap">
                          {Number(item.cgstAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* 15. Net Amt. */}
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {Number(item.total || 0).toFixed(2)}
                      </td>

                      {/* 16. Delete */}
                      <td className="py-1.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Summary Row matching user image */}
              <tfoot className="border-t border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] select-none text-xs font-bold">
                <tr>
                  <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-2 text-right font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase tracking-wider border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    TOTAL:
                  </td>
                  <td className="py-2.5 px-1 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-1 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-1 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    {baseTotals.totalQuantity}
                  </td>
                  <td className="py-2.5 px-1 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-1 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    {baseTotals.totalAmount ? baseTotals.totalAmount.toFixed(2) : ""}
                  </td>
                  <td className="py-2.5 px-1 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-1 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    {baseTotals.totalDiscount ? baseTotals.totalDiscount.toFixed(2) : ""}
                  </td>
                  <td className="py-2.5 px-1 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    {baseTotals.amountBeforeTax ? baseTotals.amountBeforeTax.toFixed(2) : ""}
                  </td>
                  <td className="py-2.5 px-1 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-1 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    {baseTotals.sgstAmount ? baseTotals.sgstAmount.toFixed(2) : ""}
                  </td>
                  <td className="py-2.5 px-1 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
                  <td className="py-2.5 px-1 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    {baseTotals.cgstAmount ? baseTotals.cgstAmount.toFixed(2) : ""}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold font-mono text-[#B88728] dark:text-[#E8C16D] border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                    ₹ {baseTotals.amountAfterTax.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Circular + Add Row Button matching user image */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              title="Add Row"
              className="grid h-7 w-7 sm:h-7.5 sm:w-7.5 place-items-center rounded-full border border-[#E8C16D] dark:border-[#E8C16D]/50 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-1 ring-[#E8C16D]/30 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </section>

        {/* 4. Bottom Split Section: Left Metadata + Right Financial Summary matching Image 3 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Side: Broker Name, Consignee Name, Remarks, Prepared By, Save Button */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-3.5">
              {/* Row 1: Broker Name, Consignee Name, Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Broker Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Broker Name
                  </label>
                  <ThemeSelectDropdown
                    value={brokerName}
                    onChange={setBrokerName}
                    options={brokerOptions}
                    buttonClassName="h-9 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>

                {/* Consignee Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Consignee Name
                  </label>
                  <input
                    type="text"
                    value={consigneeName}
                    onChange={(e) => setConsigneeName(e.target.value)}
                    placeholder="Enter consignee name"
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter any remarks or notes hear."
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
              </div>

              {/* Row 2: Prepared By & Save Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Prepared By
                  </label>
                  <input
                    type="text"
                    value={preparedBy}
                    readOnly
                    className="h-9 w-32 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D] outline-none cursor-not-allowed"
                  />
                </div>

                {/* Save Button matching Image 3 bottom-right */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 h-9 sm:h-10 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Financial Summary Card matching Image 3 */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-2 text-xs">
              {/* Gross Amount */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium">Gross Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Discount Amount */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium">Discount Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.totalDiscount.toFixed(2)}
                </span>
              </div>

              {/* Before Tax Amount */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                <span className="font-medium">Before Tax Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.amountBeforeTax.toFixed(2)}
                </span>
              </div>

              {/* SGST */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium">SGST.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.sgstAmount.toFixed(2)}
                </span>
              </div>

              {/* CGST */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium">CGST.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.cgstAmount.toFixed(2)}
                </span>
              </div>

              {/* IGST */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                <span className="font-medium">IGST.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.igstAmount.toFixed(2)}
                </span>
              </div>

              {/* After Tax Amount */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                <span className="font-medium">After Tax Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {baseTotals.amountAfterTax.toFixed(2)}
                </span>
              </div>

              {/* TDS % & TDS Amount */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium">TDS %</span>
                  <input
                    type="number"
                    min="0"
                    value={tdsPercent || ""}
                    onChange={(e) => setTdsPercent(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-7 w-12 px-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">TDS Amount.</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹ {tdsAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* TCS % & TCS Amount */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium">TCS %</span>
                  <input
                    type="number"
                    min="0"
                    value={tcsPercent || ""}
                    onChange={(e) => setTcsPercent(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-7 w-12 px-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">TCS Amount.</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹ {tcsAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Other Expense */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium text-sky-600 dark:text-sky-400">Other Expense</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={otherExpense || ""}
                    onChange={(e) => setOtherExpense(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-7 w-20 px-2 text-right font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
              </div>

              {/* Round Off */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium text-sky-600 dark:text-sky-400">Round Off</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Round Off Value.</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹ {effectiveRoundOff.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Net Amount Highlighted Row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Net Amount
                </span>
                <span className="font-mono font-black text-base sm:text-lg text-[#B88728] dark:text-[#E8C16D]">
                  ₹ {finalNetAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Right Slide-over Drawer for Party Details & Pending Challans matching Image 4 */}
        <PartyDetailsPendingChallansDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedSupplier={selectedSupplier}
          onSelectSupplier={setSelectedSupplier}
          onImportPendingChallans={handleImportPendingChallans}
        />
      </div>
    </div>
  );
}
