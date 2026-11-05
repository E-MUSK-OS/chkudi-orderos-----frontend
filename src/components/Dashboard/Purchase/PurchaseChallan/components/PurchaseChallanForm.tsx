"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import PurchaseChallanItemsTable from "./PurchaseChallanItemsTable";
import SupplierDetailsSection from "./SupplierDetailsSection";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import {
  PurchaseChallan,
  PurchaseChallanItem,
  Party,
} from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { toast } from "sonner";
import { X } from "lucide-react";

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
  { value: "Other", label: "Other" },
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

    // Top Header Fields
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

    // Supplier
    const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(
      challan?.supplier || null
    );

    // Items
    const [items, setItems] = useState<PurchaseChallanItem[]>(
      challan?.items && challan.items.length > 0
        ? challan.items
        : [
            {
              itemNo: 1,
              sku: "",
              name: "",
              orderedQty: 0,
              receivedQty: 0,
              rate: 0.0,
              amount: 0.0,
              poNo: "",
              partyChallanNo: "",
              receivedDate: "",
              remarks: "",
              printBarcode: true,
            },
          ]
    );

    // Bottom Metadata Fields
    const [courierPartner, setCourierPartner] = useState(challan?.courierPartner || "");
    const [lrNo, setLrNo] = useState(challan?.lrNo || "");
    const [receivedBy, setReceivedBy] = useState(challan?.receivedBy || "Ramesh");
    const [checkedBy, setCheckedBy] = useState(challan?.checkedBy || "Ramesh");
    const [preparedBy, setPreparedBy] = useState(challan?.preparedBy || "Ramesh");

    // Modal state for Ledger Book
    const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

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

    const handleSubmit = async () => {
      // Validate
      if (!selectedSupplier && !challan?.supplierName) {
        toast.error("Please select a Creditor Supplier.");
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

        // Aggregate partyChallanNo from items if multiple exists
        const itemPartyChallanNos = Array.from(
          new Set(
            items
              .map((it) => it.partyChallanNo?.trim())
              .filter((val): val is string => Boolean(val && val.length > 0))
          )
        );

        const finalPartyChallanNo =
          itemPartyChallanNos.length > 0
            ? itemPartyChallanNos.join(", ")
            : challan?.partyChallanNo || null;

        const payload = {
          challanNo,
          challanDate,
          partyChallanDate,
          supplierId: selectedSupplier?.id || null,
          supplierName,
          contactNo: selectedSupplier?.phone || selectedSupplier?.whatsapp || null,
          partyChallanNo: finalPartyChallanNo,
          challanFor,
          stockIn,
          courierPartner: courierPartner || null,
          lrNo: lrNo || null,
          receivedBy: receivedBy || "Ramesh",
          checkedBy: checkedBy || "Ramesh",
          preparedBy: preparedBy || "Ramesh",
          items: items.map((it, idx) => ({
            ...it,
            itemNo: idx + 1,
            orderedQty: Number(it.orderedQty) || 0,
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

    return (
      <div className="space-y-6">
        {/* Top Info Card matching Sales Challan */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Challan No */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Challan No
                </label>
                <input
                  type="text"
                  readOnly
                  value={challanNo}
                  className="h-10 w-36 px-3.5 text-xs sm:text-sm font-bold font-mono text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC]/40 dark:bg-[#1A160E]/50 border border-[#E8C16D]/40 dark:border-[#E8C16D]/30 rounded-2xl text-center cursor-not-allowed shadow-xs"
                />
              </div>

              {/* Date */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Date
                </label>
                <div className="w-36">
                  <DatePicker
                    value={challanDate}
                    onChange={(_, dateStr) => setChallanDate(dateStr || "")}
                    placeholder="25-10-2026"
                    buttonClassName="h-10 px-3 rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>
              </div>

              {/* Party Challan Date */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Party Challan Date
                </label>
                <div className="w-36">
                  <DatePicker
                    value={partyChallanDate}
                    onChange={(_, dateStr) => setPartyChallanDate(dateStr || "")}
                    placeholder="27-10-2026"
                    buttonClassName="h-10 px-3 rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>
              </div>

              {/* Challan For */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Challan For
                </label>
                {isOtherChallanForActive ? (
                  <div className="flex items-center gap-1.5">
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
                      className="h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-[#E8C16D] dark:border-[#F5C451] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
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
                      className="h-10 px-3.5 rounded-2xl bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black font-bold text-xs hover:opacity-90 transition-all cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtherChallanForActive(false);
                        setCustomChallanFor("");
                      }}
                      className="h-10 px-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="w-36">
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
                      options={[
                        { value: "Purchase", label: "Purchase" },
                        { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
                        ...(challanFor && !["Purchase", "Borrow (Uchhina)", "Other"].includes(challanFor)
                          ? [{ value: challanFor, label: challanFor }]
                          : []),
                        { value: "Other", label: "+ Other (Enter custom value)" },
                      ]}
                      buttonClassName="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                      menuClassName="min-w-[160px]"
                    />
                  </div>
                )}
              </div>

              {/* Stock In */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Stock In
                </label>
                <div className="w-36">
                  <ThemeSelectDropdown
                    value={stockIn}
                    onChange={setStockIn}
                    options={stockInOptions}
                    buttonClassName="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                    menuClassName="min-w-[160px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Section: Exactly like Sales Challan */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left 3/4 Columns: Challan Details + Delivery & Inward Verification */}
          <div className="lg:col-span-3">
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
            />
          </div>

          {/* Right 1/4 Column: Supplier Details [Creditor] */}
          <div className="lg:col-span-1">
            <SupplierDetailsSection
              selectedSupplier={selectedSupplier}
              onSelectSupplier={setSelectedSupplier}
              onOpenLedgerModal={() => setLedgerModalOpen(true)}
            />
          </div>
        </div>

        {/* Ledger Book Modal for creating new Sundry Creditors */}
        <LedgerBookModal
          isOpen={ledgerModalOpen}
          onClose={() => setLedgerModalOpen(false)}
          defaultAccountHead="Sundry Creditors"
          entityTitle="Supplier"
          onPartyCreated={(party: Party) => {
            setSelectedSupplier(party);
            setLedgerModalOpen(false);
            toast.success(`Supplier "${party.partyName}" added and selected.`);
          }}
        />
      </div>
    );
  }
);

export default PurchaseChallanForm;
