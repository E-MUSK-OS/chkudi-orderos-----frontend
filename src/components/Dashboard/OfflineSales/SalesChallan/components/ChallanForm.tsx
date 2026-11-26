"use client";

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ChallanItemsTable from "./ChallanItemsTable";
import PartyDetailsDrawer from "./PartyDetailsDrawer";
import AdditionalExpensesModal, {
  AdditionalExpenseItem,
} from "@/components/Dashboard/common/AdditionalExpensesModal";
import {
  SalesChallan,
  SalesChallanItem,
  Party,
  PartyPendingOrder,
} from "../types/challan.types";
import { challanService } from "../services/challan.service";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrentUserName } from "@/utils/auth";
import { toast } from "sonner";
import { Eye, X } from "lucide-react";

export interface ChallanFormHandle {
  submit: () => void;
}

export interface ChallanFormProps {
  challan: SalesChallan | null;
  onSuccess: () => void;
  onCancel: () => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

const salesForOptions: ThemeSelectOption[] = [
  { value: "Product", label: "Product" },
  { value: "Sample", label: "Sample" },
  { value: "Fabric", label: "Fabric" },
  { value: "Service", label: "Service" },
  { value: "Other", label: "Other" },
];

const challanForOptions: ThemeSelectOption[] = [
  { value: "Sales", label: "Sales" },
  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
  { value: "Job Work", label: "Job Work" },
  { value: "Sample", label: "Sample" },
  { value: "Returnable", label: "Returnable" },
  { value: "Other", label: "+ Other (Enter custom value)" },
];

const stockOutOptions: ThemeSelectOption[] = [
  { value: "General", label: "General" },
  { value: "Main Godown", label: "Main Godown" },
  { value: "Warehouse 1", label: "Warehouse 1" },
];

const ChallanForm = forwardRef<ChallanFormHandle, ChallanFormProps>(
  function ChallanForm(
    {
      challan,
      onSuccess,
      isSaving,
      setIsSaving,
    },
    ref
  ) {
    const todayStr = new Date().toISOString().split("T")[0];

    // Consignment Info fields matching Image 3 (Dark) & Image 4 (Light)
    const [challanNo, setChallanNo] = useState(challan?.challanNo || "");
    const [challanDate, setChallanDate] = useState(
      challan?.challanDate
        ? new Date(challan.challanDate).toISOString().split("T")[0]
        : todayStr
    );
    const [challanRefNo, setChallanRefNo] = useState(
      challan?.challanRefNo || ""
    );
    const [refParty, setRefParty] = useState(
      challan?.refParty || challan?.challanRefNo || ""
    );
    const [salesFor, setSalesFor] = useState(challan?.salesFor || "Product");
    const [challanFor, setChallanFor] = useState(challan?.challanFor || "Sales");
    const [isOtherChallanForActive, setIsOtherChallanForActive] = useState(false);
    const [customChallanFor, setCustomChallanFor] = useState("");
    const customChallanForRef = useRef<HTMLInputElement>(null);

    const [stockOutFrom, setStockOutFrom] = useState(
      challan?.stockOutFrom || "General"
    );
    const [consigneeName, setConsigneeName] = useState(
      challan?.consigneeName || "Not Applicable"
    );

    // Party & Drawer State
    const [selectedParty, setSelectedParty] = useState<Party | null>(
      challan?.party || null
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Additional fields & controls
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
    const [deliveryTerms, setDeliveryTerms] = useState(
      challan?.deliveryTerms || ""
    );
    const [preparedBy, setPreparedBy] = useState(
      challan?.preparedBy || ""
    );

    useEffect(() => {
      if (!challan?.preparedBy) {
        setPreparedBy((prev) => prev || getCurrentUserName());
      }
    }, [challan?.preparedBy]);
    const [deliveryBy, setDeliveryBy] = useState(
      challan?.deliveryBy || "Buyer"
    );

    // Ref Parties list for dropdown
    const [refPartyOptions, setRefPartyOptions] = useState<ThemeSelectOption[]>([]);

    // Items
    const [items, setItems] = useState<SalesChallanItem[]>(
      challan?.items && challan.items.length > 0
        ? challan.items
        : [
          {
            itemNo: 1,
            sku: "",
            name: "",
            size: "",
            soNo: "",
            realStock: 0,
            orderQty: 0,
            deliveredQty: 0,
            quantity: 0,
            rate: 0.0,
            amount: 0.0,
            dispatchDate: "1",
            subCn: "",
            remarks: "",
            printBarcode: true,
          },
        ]
    );

    // Fetch next Challan No if creating new
    useEffect(() => {
      if (!challan?.id) {
        challanService
          .getNextChallanNo()
          .then((nextNo) => {
            if (nextNo) {
              setChallanNo(nextNo);
            }
          })
          .catch((err) => console.error("Failed to load next challan no", err));
      }
    }, [challan?.id]);

    // Fetch parties for Ref Party dropdown
    useEffect(() => {
      challanService
        .getParties()
        .then((list) => {
          if (list && list.length > 0) {
            setRefPartyOptions([
              { value: "", label: "Select ref. party" },
              ...list.map((p) => ({ value: p.partyName, label: p.partyName })),
            ]);
          }
        })
        .catch(() => { });
    }, []);

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
        setChallanRefNo(challan.challanRefNo || "");
        setRefParty(challan.refParty || challan.challanRefNo || "");
        setChallanFor(challan.challanFor || "Sales");
        setSalesFor(challan.salesFor || "Product");
        setStockOutFrom(challan.stockOutFrom || "General");
        setConsigneeName(challan.consigneeName || "Not Applicable");
        setDeliveryBy(challan.deliveryBy || "Buyer");
        setPreparedBy(challan.preparedBy || getCurrentUserName());
        setDeliveryTerms(challan.deliveryTerms || "");
        setAdditionalExpense(challan.additionalExpense || 0);
        setAdditionalExpenses(
          Array.isArray(challan.additionalExpenses)
            ? challan.additionalExpenses
            : []
        );
        if (challan.items && challan.items.length > 0) {
          setItems(challan.items);
        }
        setSelectedParty(challan.party || null);
      }
    }, [challan, todayStr]);

    // Import pending orders into items table
    const handleImportPendingOrders = (orders: PartyPendingOrder[]) => {
      if (!orders || orders.length === 0) return;

      const newRows: SalesChallanItem[] = [];
      for (const ord of orders) {
        if (ord.items && ord.items.length > 0) {
          for (const it of ord.items) {
            const oQty = it.orderQty || ord.totalQty || 0;
            const dQty = it.deliveredQty || 0;
            const r = it.rate || 0;
            newRows.push({
              itemNo: items.length + newRows.length + 1,
              sku: it.sku || ord.orderNo,
              name: it.name || ord.orderNo,
              size: it.size || "",
              soNo: it.soNo || ord.orderNo,
              realStock: it.realStock ?? 0,
              orderQty: oQty,
              deliveredQty: dQty,
              quantity: dQty,
              rate: r,
              amount: it.amount || dQty * r,
              dispatchDate: "1",
              subCn: "",
              remarks: "",
              printBarcode: true,
            });
          }
        } else {
          const totalQ = Number(ord.totalQty) || 0;
          newRows.push({
            itemNo: items.length + newRows.length + 1,
            sku: ord.orderNo,
            name: ord.orderNo,
            size: "",
            soNo: ord.orderNo,
            realStock: 0,
            orderQty: totalQ,
            deliveredQty: 0,
            quantity: 0,
            rate: 0.0,
            amount: 0.0,
            dispatchDate: "1",
            subCn: "",
            remarks: "",
            printBarcode: true,
          });
        }
      }

      // If the only row is empty, replace it
      if (
        items.length === 1 &&
        !items[0].sku.trim() &&
        (items[0].orderQty || 0) === 0 &&
        (items[0].deliveredQty || items[0].quantity || 0) === 0
      ) {
        setItems(newRows.map((r, i) => ({ ...r, itemNo: i + 1 })));
      } else {
        setItems((prev) => [
          ...prev,
          ...newRows.map((r, i) => ({ ...r, itemNo: prev.length + i + 1 })),
        ]);
      }
    };

    // Save Handler
    const handleSave = async () => {
      if (!selectedParty) {
        toast.error("Please click 'Select Party' to select a Party [Debtor].");
        setIsDrawerOpen(true);
        return;
      }

      if (!challanNo.trim()) {
        toast.error("Challan No is required.");
        return;
      }

      const validItems = items.filter(
        (item) => item.sku && item.sku.trim().length > 0
      );
      if (validItems.length === 0) {
        toast.error("Please add at least one item with a valid SKU.");
        return;
      }

      const payload = {
        partyId: selectedParty.id,
        partyName: selectedParty.partyName,
        contactNo: selectedParty.phone || selectedParty.whatsapp || null,
        challanNo: challanNo.trim(),
        challanRefNo: challanRefNo.trim() || null,
        refParty: refParty.trim() || null,
        challanDate,
        challanFor,
        salesFor: salesFor || "Product",
        stockOutFrom,
        consigneeName: consigneeName || selectedParty.partyName || "Not Applicable",
        deliveryBy: deliveryBy === "Select ..." ? "Buyer" : deliveryBy,
        preparedBy,
        deliveryTerms,
        additionalExpense: Number(additionalExpense) || 0,
        additionalExpenses,
        items: validItems.map((item, idx) => {
          const dQty =
            Number(item.deliveredQty) || Number(item.quantity) || 0;
          const r = Number(item.rate) || 0;
          return {
            ...item,
            itemNo: idx + 1,
            sku: item.sku.trim(),
            name:
              item.name && item.name.trim().length > 0
                ? item.name.trim()
                : item.sku.trim(),
            size: item.size ? item.size.trim() : null,
            soNo: item.soNo ? item.soNo.trim() : null,
            realStock: Number(item.realStock) || 0,
            orderQty: Number(item.orderQty) || 0,
            deliveredQty: dQty,
            quantity: dQty,
            rate: r,
            amount: dQty * r,
          };
        }),
      };

      try {
        setIsSaving(true);
        if (challan?.id) {
          await challanService.updateChallan(challan.id, payload);
          toast.success("Sales Challan updated successfully!");
        } else {
          await challanService.createChallan(payload);
          toast.success("Sales Challan created successfully!");
        }
        onSuccess();
      } catch (err: any) {
        console.error("Save Sales Challan error:", err);
        toast.error(err.message || "Failed to save sales challan.");
      } finally {
        setIsSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: handleSave,
    }));

    return (
      <div className="space-y-4 font-sans">
        {/* Top Consignment Info Card - OUTSIDE drawer scope so it is NEVER blurred */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm">
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

            {/* Sales For */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Sales For
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={salesFor}
                  onChange={setSalesFor}
                  options={salesForOptions}
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  menuClassName="min-w-[150px]"
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
                    placeholder="Enter custom..."
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
                        setTimeout(
                          () => customChallanForRef.current?.focus(),
                          50
                        );
                      } else {
                        setChallanFor(val);
                      }
                    }}
                    options={challanForOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                    menuClassName="min-w-[170px]"
                  />
                </div>
              )}
            </div>

            {/* Ref. Party. */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Ref. Party.
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={refParty}
                  onChange={setRefParty}
                  options={refPartyOptions}
                  placeholder="Select ref. party"
                  className="w-full"
                  buttonClassName="w-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  menuClassName="min-w-[180px]"
                />
              </div>
            </div>

            {/* Ref. Challan No. */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Ref. Challan No.
              </label>
              <input
                type="text"
                value={challanRefNo}
                onChange={(e) => setChallanRefNo(e.target.value)}
                placeholder="Ref. Challan No."
                className="flex-1 min-w-0 h-9 sm:h-10 px-2.5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl sm:rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none font-mono"
              />
            </div>

            {/* Select Party Button */}
            <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end min-w-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`w-full lg:w-auto inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${selectedParty
                  ? "bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] text-[#B88728] dark:text-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                  : "border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/20"
                  }`}
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[240px]">
                  {selectedParty ? selectedParty.partyName : "Select Party"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content & Drawer Container - Scoped below Header and Filter Bar */}
        <div className="space-y-4 relative min-h-[580px] sm:min-h-[640px] overflow-x-clip">
          {/* Full-width Items Table with bottom verification and save button */}
          <ChallanItemsTable
          items={items}
          onChangeItems={setItems}
          additionalExpense={additionalExpense}
          onChangeAdditionalExpense={setAdditionalExpense}
          onOpenAdditionalExpenseModal={() => setExpenseModalOpen(true)}
          deliveryTerms={deliveryTerms}
          onChangeDeliveryTerms={setDeliveryTerms}
          preparedBy={preparedBy}
          onChangePreparedBy={setPreparedBy}
          deliveryBy={deliveryBy}
          onChangeDeliveryBy={setDeliveryBy}
          onSave={handleSave}
          isSaving={isSaving}
        />

        {/* Slide-over Drawer for Party Details & Pending Orders */}
        <PartyDetailsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedParty={selectedParty}
          onSelectParty={(party) => {
            setSelectedParty(party);
          }}
          onImportPendingOrders={handleImportPendingOrders}
        />

        {/* Additional Expenses Modal */}
        <AdditionalExpensesModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          subtitle="Manage additional expenses for this product / material / service sale"
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

export default ChallanForm;
