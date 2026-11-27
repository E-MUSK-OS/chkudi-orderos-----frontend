"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { User, Eye, Calendar, Plus, X } from "lucide-react";
import PurchaseChallanItemsTable from "./PurchaseChallanItemsTable";
import PartyDetailsPendingOrdersDrawer from "./PartyDetailsPendingOrdersDrawer";
import AdditionalExpensesModal, {
  AdditionalExpenseItem,
} from "@/components/Dashboard/common/AdditionalExpensesModal";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import {
  PurchaseChallan,
  PurchaseChallanItem,
  Party, 
  SupplierPendingOrder,
} from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrentUserName } from "@/utils/auth";
import { toast } from "sonner";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";

export interface PurchaseChallanFormHandle {
  submit: () => void;
}

export interface PurchaseChallanFormProps {
  challan: PurchaseChallan | null;
  onSuccess: () => void;
  onCancel: () => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

const challanForOptions: ThemeSelectOption[] = [
  { value: "Purchase", label: "Purchase" },
  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
  { value: "Other", label: "+ Other (Enter custom value)" },
];

const stockInOptions: ThemeSelectOption[] = [
  { value: "General", label: "General" },
  { value: "COCOBLU", label: "COCOBLU" },
  { value: "MYNTRA", label: "MYNTRA" },
];

const PurchaseChallanForm = forwardRef<PurchaseChallanFormHandle, PurchaseChallanFormProps>(
  function PurchaseChallanForm(
    {
      challan,
      onSuccess,
      onCancel,
      isSaving,
      setIsSaving,
    },
    ref
  ) {
    const todayStr = new Date().toISOString().split("T")[0];

    // Filter Bar State matching User Image
    const [challanNo, setChallanNo] = useState(challan?.challanNo || "");
    const [challanDate, setChallanDate] = useState(
      challan?.challanDate
        ? new Date(challan.challanDate).toISOString().split("T")[0]
        : todayStr
    );
    const [partyChallanDate, setPartyChallanDate] = useState(
      challan?.partyChallanDate
        ? new Date(challan.partyChallanDate).toISOString().split("T")[0]
        : todayStr
    );
    const [challanFor, setChallanFor] = useState(challan?.challanFor || "Purchase");
    const [isOtherChallanForActive, setIsOtherChallanForActive] = useState(false);
    const [customChallanFor, setCustomChallanFor] = useState("");
    const customChallanForRef = useRef<HTMLInputElement>(null);
    const [stockIn, setStockIn] = useState(challan?.stockIn || "General");
    const [partyChallanNo, setPartyChallanNo] = useState(challan?.partyChallanNo || "");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState(challan?.companyId || "");
    const [companyName, setCompanyName] = useState(challan?.companyName || "");
    const [branchId, setBranchId] = useState(challan?.branchId || "");
    const [branchName, setBranchName] = useState(challan?.branchName || "");

    useEffect(() => {
      if (!challan?.id) return;
      if (challan.companyId) setCompanyId(challan.companyId);
      if (challan.companyName) setCompanyName(challan.companyName);
      if (challan.branchId) setBranchId(challan.branchId);
      if (challan.branchName) setBranchName(challan.branchName);
    }, [challan?.id, challan?.companyId, challan?.companyName, challan?.branchId, challan?.branchName]);

    useEffect(() => {
      companyService
        .getCompanies({ pageSize: 100 })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setCompanies(list);
          if (!challan?.companyId && list.length > 0) {
            const preferred =
              list.find((c) => c.isDefault && c.status === "ACTIVE") ||
              list.find((c) => c.isDefault) ||
              list.find((c) => c.status === "ACTIVE") ||
              list[0];
            if (preferred) {
              setCompanyId(preferred.id);
              setCompanyName(preferred.companyName || preferred.legalName || "");
            }
          }
        })
        .catch(() => {});
    }, [challan?.companyId]);

    const companyOptions: ThemeSelectOption[] = companies
      .filter((c) => !c.isBranch)
      .map((c) => ({
        value: c.id,
        label: c.companyName || c.legalName || "",
      }));

    const selectedCompanyObj = companies.find((c) => c.id === companyId) as
      | (Company & { branches?: Array<{ id?: string; branchName: string }> })
      | undefined;
    const branchOptions: ThemeSelectOption[] = [
      ...(selectedCompanyObj?.branches || []).map((b) => ({
        value: b.id || b.branchName,
        label: b.branchName || "",
      })),
      ...companies
        .filter((c) => c.isBranch && c.parentCompanyId === companyId)
        .map((c) => ({
          value: c.id,
          label: c.companyBranchName || c.companyName || c.legalName || "",
        })),
    ];

    // Supplier & Slide-over Drawer State
    const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(
      challan?.supplier || null
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Items
    const [items, setItems] = useState<PurchaseChallanItem[]>(
      challan?.items && challan.items.length > 0
        ? challan.items
        : [
          {
            itemNo: 1,
            sku: "",
            poNo: "",
            size: "",
            orderedQty: 0,
            pendingQty: 0,
            name: "",
            receivedQty: 0,
            rate: 0.0,
            amount: 0.0,
            lotNo: "",
            partyChallanNo: "",
            receivedDate: "",
            remarks: "",
          },
        ]
    );

    // Verification & Additional Expense Fields
    const [courierPartner, setCourierPartner] = useState(challan?.courierPartner || "");
    const [lrNo, setLrNo] = useState(challan?.lrNo || "");
    const [receivedBy, setReceivedBy] = useState(challan?.receivedBy || "Ramesh");
    const [checkedBy, setCheckedBy] = useState(challan?.checkedBy || "Ramesh");
    const [preparedBy, setPreparedBy] = useState(challan?.preparedBy || "");

    useEffect(() => {
      if (!challan?.preparedBy) {
        setPreparedBy((prev) => prev || getCurrentUserName());
      }
    }, [challan?.preparedBy]);
    const [additionalExpense, setAdditionalExpense] = useState<number>(
      challan?.additionalExpense || 0
    );
    const [additionalExpenses, setAdditionalExpenses] = useState<
      AdditionalExpenseItem[]
    >(
      Array.isArray(challan?.additionalExpenses)
        ? challan.additionalExpenses
        : []
    );
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);

    // Fetch next Challan No if creating new
    useEffect(() => {
      if (!challan?.id) {
        purchaseChallanService
          .getNextChallanNo()
          .then((nextNo) => {
            if (nextNo) {
              setChallanNo(nextNo);
            }
          })
          .catch((err) => console.error("Failed to load next challan no", err));
      }
    }, [challan?.id]);

    // Automatically open the drawer when creating a new challan
    useEffect(() => {
      if (!challan) {
        const timer = setTimeout(() => {
          setIsDrawerOpen(true);
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [challan]);

    // Sync state when challan prop changes (on editing)
    useEffect(() => {
      if (challan) {
        setChallanNo(challan.challanNo || "");
        setChallanDate(
          challan.challanDate
            ? new Date(challan.challanDate).toISOString().split("T")[0]
            : todayStr
        );
        setPartyChallanDate(
          challan.partyChallanDate
            ? new Date(challan.partyChallanDate).toISOString().split("T")[0]
            : todayStr
        );
        setChallanFor(challan.challanFor || "Purchase");
        setStockIn(challan.stockIn || "General");
        setPartyChallanNo(challan.partyChallanNo || "");
        setSelectedSupplier(challan.supplier || null);
        if (challan.items && challan.items.length > 0) {
          setItems(challan.items);
        }
        setCourierPartner(challan.courierPartner || "");
        setLrNo(challan.lrNo || "");
        setReceivedBy(challan.receivedBy || "Ramesh");
        setCheckedBy(challan.checkedBy || "Ramesh");
        setPreparedBy(challan.preparedBy || getCurrentUserName());
        setAdditionalExpense(challan.additionalExpense || 0);
        setAdditionalExpenses(
          Array.isArray(challan.additionalExpenses)
            ? challan.additionalExpenses
            : []
        );
      }
    }, [challan, todayStr]);

    const handleSubmit = async () => {
      // Validate
      if (!selectedSupplier && !challan?.supplierName) {
        toast.error("Please click 'Select Party' to choose a Creditor Supplier.");
        setIsDrawerOpen(true);
        return;
      }

      if (!challanNo.trim()) {
        toast.error("Challan No is required.");
        return;
      }

      if (items.length === 0) {
        toast.error("At least one inward item is required.");
        return;
      }

      const hasInvalidItem = items.some((it) => !it.sku.trim());
      if (hasInvalidItem) {
        toast.error("Please provide a valid SKU for all items.");
        return;
      }

      try {
        setIsSaving(true);

        const supplierName =
          selectedSupplier?.partyName || challan?.supplierName || "Direct Supplier";

        // Aggregate partyChallanNo from items if user filled them per row or top bar
        const itemPartyChallanNos = Array.from(
          new Set(
            items
              .map((it) => it.partyChallanNo?.trim())
              .filter((val): val is string => Boolean(val && val.length > 0))
          )
        );

        const finalPartyChallanNo =
          partyChallanNo.trim() ||
          (itemPartyChallanNos.length > 0
            ? itemPartyChallanNos.join(", ")
            : challan?.partyChallanNo || null);

        const itemLotNos = Array.from(
          new Set(
            items
              .map((it) => it.lotNo?.trim())
              .filter((val): val is string => Boolean(val && val.length > 0))
          )
        );
        const finalLotNo =
          itemLotNos.length > 0 ? itemLotNos.join(", ") : challan?.lotNo || null;

        const payload = {
          challanNo,
          challanDate,
          partyChallanDate,
          supplierId: selectedSupplier?.id || null,
          supplierName,
          contactNo: selectedSupplier?.phone || selectedSupplier?.whatsapp || null,
          partyChallanNo: finalPartyChallanNo,
          lotNo: finalLotNo,
          challanFor,
          stockIn,
          companyId: companyId || null,
          companyName: companyName || null,
          branchId: branchId || null,
          branchName: branchName || null,
          courierPartner: courierPartner || null,
          lrNo: lrNo || null,
          receivedBy: receivedBy || "Ramesh",
          checkedBy: checkedBy || "Ramesh",
          preparedBy: preparedBy || getCurrentUserName(),
          additionalExpense: Number(additionalExpense) || 0,
          additionalExpenses,
          items: items.map((it, idx) => ({
            ...it,
            size: it.size || null,
            lotNo: it.lotNo ? it.lotNo.trim() : null,
            itemNo: idx + 1,
            orderedQty: Number(it.orderedQty) || 0,
            pendingQty: Number(it.pendingQty) || 0,
            receivedQty: Number(it.receivedQty) || 0,
            rate: Number(it.rate) || 0,
            amount: (Number(it.receivedQty) || 0) * (Number(it.rate) || 0),
          })),
        };

        if (challan?.id) {
          await purchaseChallanService.updateChallan(challan.id, payload);
          toast.success("Purchase Challan updated successfully.");
        } else {
          await purchaseChallanService.createChallan(payload);
          toast.success("Purchase Challan created successfully.");
        }

        onSuccess();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to save purchase challan.");
      } finally {
        setIsSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    // Import pending orders into items table
    const handleImportPendingOrders = (pendingList: SupplierPendingOrder[]) => {
      if (!pendingList || pendingList.length === 0) return;

      const newRows: PurchaseChallanItem[] = pendingList.map((po, index) => ({
        itemNo: items.length + index + 1,
        sku: po.sku || "",
        poNo: po.poNo || po.orderNo || "",
        lotNo: po.lotNo || "",
        size: po.size || "",
        orderedQty: po.totalQty || 0,
        pendingQty: po.pendingQty || 0,
        receivedQty: 0,
        rate: po.rate || 0,
        amount: 0,
        name: po.detail || "",
        partyChallanNo: partyChallanNo || "",
        receivedDate: challanDate || "",
        remarks: "",
      }));

      // If the first row is completely empty, replace it
      if (
        items.length === 1 &&
        !items[0].sku.trim() &&
        items[0].receivedQty === 0
      ) {
        setItems(newRows.map((r, i) => ({ ...r, itemNo: i + 1 })));
      } else {
        setItems((prev) => [
          ...prev,
          ...newRows.map((r, i) => ({ ...r, itemNo: prev.length + i + 1 })),
        ]);
      }
    };

    return (
      <div className="space-y-4 font-sans">
        {/* Filter / Info Card - OUTSIDE drawer scope so it is NEVER blurred */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center text-xs">
            {/* Challan No */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Challan No
              </label>
              <input
                type="text"
                value={challanNo}
                readOnly
                placeholder="Challan No"
                className="flex-1 min-w-0 h-9 sm:h-10 px-3 text-xs sm:text-sm font-bold bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] rounded-xl sm:rounded-2xl text-[#B88728] dark:text-[#E8C16D] outline-none font-mono text-center shadow-2xs cursor-default select-all"
                title="Challan No (Auto-generated)"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Date
              </label>
              <div className="flex-1 min-w-0">
                <DatePicker
                  allowInput
                  value={challanDate}
                  onChange={(_, dateStr) => setChallanDate(dateStr || todayStr)}
                  placeholder="YYYY-MM-DD"
                  dateFormat="yyyy-MM-dd"
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            {/* Party Challan Date */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Party Challan Date
              </label>
              <div className="flex-1 min-w-0">
                <DatePicker
                  allowInput
                  value={partyChallanDate}
                  onChange={(_, dateStr) => setPartyChallanDate(dateStr || todayStr)}
                  placeholder="YYYY-MM-DD"
                  dateFormat="yyyy-MM-dd"
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            {/* Challan For */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Challan For
              </label>
              {isOtherChallanForActive ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    ref={customChallanForRef}
                    type="text"
                    value={customChallanFor}
                    onChange={(e) => setCustomChallanFor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = customChallanFor.trim();
                        if (trimmed) {
                          setChallanFor(trimmed);
                          setIsOtherChallanForActive(false);
                          setCustomChallanFor("");
                        }
                      } else if (e.key === "Escape") {
                        setIsOtherChallanForActive(false);
                        setCustomChallanFor("");
                      }
                    }}
                    placeholder="Enter custom reason..."
                    className="h-9 sm:h-10 px-2.5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-[#E8C16D] rounded-xl sm:rounded-2xl text-[#0A0E1A] dark:text-white outline-none flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customChallanFor.trim();
                      if (trimmed) {
                        setChallanFor(trimmed);
                        setIsOtherChallanForActive(false);
                        setCustomChallanFor("");
                      }
                    }}
                    className="h-9 sm:h-10 px-2.5 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs shrink-0"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherChallanForActive(false);
                      setCustomChallanFor("");
                    }}
                    className="h-9 sm:h-10 px-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] text-slate-500 shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <ThemeSelectDropdown
                    value={challanFor}
                    onChange={(val) => {
                      if (val === "Other") {
                        setIsOtherChallanForActive(true);
                        setTimeout(() => customChallanForRef.current?.focus(), 50);
                      } else {
                        setChallanFor(val);
                      }
                    }}
                    options={challanForOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                    menuClassName="min-w-[160px]"
                  />
                </div>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1fr_auto] gap-3 items-center text-xs">
            {/* Stock Inward in */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Stock Inward in
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={stockIn}
                  onChange={setStockIn}
                  options={stockInOptions}
                  placeholder="Select Challan For"
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  menuClassName="min-w-[160px]"
                />
              </div>
            </div>

            {/* Party Challan No */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Party Challan No
              </label>
              <input
                type="text"
                value={partyChallanNo}
                onChange={(e) => setPartyChallanNo(e.target.value)}
                placeholder="Party Challan No"
                className="flex-1 min-w-0 h-9 sm:h-10 px-2.5 text-xs sm:text-sm font-semibold bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl sm:rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none font-mono"
              />
            </div>

            {/* Company & Branch */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Company
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={companyId}
                  onChange={(val) => {
                    const comp = companies.find((c) => c.id === val);
                    setCompanyId(val);
                    setCompanyName(comp?.companyName || comp?.legalName || "");
                    setBranchId("");
                    setBranchName("");
                  }}
                  options={companyOptions}
                  placeholder="Select Company"
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  menuClassName="min-w-[200px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Branch
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={branchId}
                  onChange={(val) => {
                    const opt = branchOptions.find((b) => b.value === val);
                    setBranchId(val);
                    setBranchName(opt?.label || "");
                  }}
                  options={branchOptions}
                  disabled={!companyId || branchOptions.length === 0}
                  placeholder={
                    !companyId
                      ? "Select Company first"
                      : branchOptions.length === 0
                      ? "Company has no branch"
                      : "Select Branch"
                  }
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  menuClassName="min-w-[180px]"
                />
              </div>
            </div>

            {/* Right Side: Select Party Button */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end min-w-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`w-full lg:w-auto inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${selectedSupplier
                  ? "bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] text-[#B88728] dark:text-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                  : "border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/20"
                  }`}
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[240px]">
                  {selectedSupplier ? selectedSupplier.partyName : "Select Party"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content & Drawer Container - Scoped below Header and Filter Bar */}
        <div className="space-y-4 relative min-h-[580px] sm:min-h-[640px] overflow-x-clip">
          {/* Full-width Items Table with bottom verification and save button */}
          <PurchaseChallanItemsTable
          items={items}
          onChangeItems={setItems}
          courierPartner={courierPartner}
          onChangeCourierPartner={setCourierPartner}
          lrNo={lrNo}
          onChangeLrNo={setLrNo}
          receivedBy={receivedBy}
          onChangeReceivedBy={setReceivedBy}
          checkedBy={checkedBy}
          onChangeCheckedBy={setCheckedBy}
          preparedBy={preparedBy}
          onChangePreparedBy={setPreparedBy}
          additionalExpense={additionalExpense}
          onChangeAdditionalExpense={setAdditionalExpense}
          onOpenAdditionalExpenseModal={() => setExpenseModalOpen(true)}
          onSave={handleSubmit}
          isSaving={isSaving}
        />

        {/* Right Slide-over Drawer for Party Details & Pending Orders */}
        <PartyDetailsPendingOrdersDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedSupplier={selectedSupplier}
          onSelectSupplier={setSelectedSupplier}
          onImportPendingOrders={handleImportPendingOrders}
        />

        {/* Additional Expenses Modal */}
        <AdditionalExpensesModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          subtitle="Manage additional expenses for this product purchase"
          expenses={additionalExpenses}
          onSave={(rows, total) => {
            setAdditionalExpenses(rows);
            setAdditionalExpense(total);
          }}
        />
        </div>
      </div>
    );
  }
);

export default PurchaseChallanForm;
