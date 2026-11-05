"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import ChallanItemsTable from "./ChallanItemsTable";
import PartyDetailsSection from "./PartyDetailsSection";
import LedgerBookModal from "./LedgerBookModal";
import {
  SalesChallan,
  SalesChallanItem,
  Party,
} from "../types/challan.types";
import { challanService } from "../services/challan.service";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { toast } from "sonner";
import { X } from "lucide-react";

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

const ChallanForm = forwardRef<ChallanFormHandle, ChallanFormProps>(function ChallanForm(
  {
    challan,
    onSuccess,
    onCancel,
    isSaving,
    setIsSaving,
  },
  ref
) {
  // Top fields matching Image 3 & 4
  const [challanNo, setChallanNo] = useState(challan?.challanNo || "");
  const [challanDate, setChallanDate] = useState(
    challan?.challanDate
      ? new Date(challan.challanDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [challanRefNo, setChallanRefNo] = useState(challan?.challanRefNo || "");
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

  // Bottom fields
  const [deliveryBy, setDeliveryBy] = useState(challan?.deliveryBy || "Buyer");
  const [preparedBy, setPreparedBy] = useState(challan?.preparedBy || "Ramesh");
  const [deliveryTerms, setDeliveryTerms] = useState(
    challan?.deliveryTerms || ""
  );

  // Items
  const [items, setItems] = useState<SalesChallanItem[]>(
    challan?.items && challan.items.length > 0
      ? challan.items
      : [
          {
            itemNo: 1,
            sku: "",
            name: "",
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

  // Party
  const [selectedParty, setSelectedParty] = useState<Party | null>(
    challan?.party || null
  );

  // Ledger Book Modal
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  // Sync state when challan prop changes (e.g. on editing)
  useEffect(() => {
    if (challan) {
      setChallanNo(challan.challanNo || "");
      setChallanDate(
        challan.challanDate
          ? new Date(challan.challanDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setChallanRefNo(challan.challanRefNo || "");
      setChallanFor(challan.challanFor || "Sales");
      setStockOutFrom(challan.stockOutFrom || "General");
      setConsigneeName(challan.consigneeName || "Not Applicable");
      setDeliveryBy(challan.deliveryBy || "Buyer");
      setPreparedBy(challan.preparedBy || "Ramesh");
      setDeliveryTerms(challan.deliveryTerms || "");
      if (challan.items && challan.items.length > 0) {
        setItems(challan.items);
      }
      setSelectedParty(challan.party || null);
    } else {
      challanService.getNextChallanNo().then((num) => {
        setChallanNo(num);
      });
    }
  }, [challan]);

  // Handle Save
  const handleSave = async () => {
    if (!selectedParty) {
      toast.error("Please select a Party [Debtor] before saving.");
      return;
    }

    const validItems = items.filter((item) => item.sku && item.sku.trim().length > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with a valid SKU.");
      return;
    }

    const payload = {
      partyId: selectedParty.id,
      partyName: selectedParty.partyName,
      contactNo: selectedParty.phone || selectedParty.whatsapp || null,
      challanNo,
      challanRefNo: challanRefNo || null,
      challanDate,
      challanFor,
      stockOutFrom,
      consigneeName,
      deliveryBy,
      preparedBy,
      deliveryTerms,
      items: validItems.map((item, idx) => ({
        ...item,
        itemNo: idx + 1,
        name: item.name && item.name.trim().length > 0 ? item.name.trim() : item.sku.trim(),
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
      })),
    };

    try {
      setIsSaving(true);
      if (challan) {
        await challanService.updateChallan(challan.id, payload);
        toast.success("Sales Challan updated successfully!");
      } else {
        await challanService.createChallan(payload);
        toast.success("Sales Challan created successfully!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save challan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Expose submit method to parent header Save button without side-effect triggers
  useImperativeHandle(ref, () => ({
    submit: handleSave,
  }));

  return (
    <div className="space-y-6">
      {/* Top Consignment Info Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* OC Challan No */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                OC Challan No
              </label>
              <input
                type="text"
                readOnly
                value={challanNo}
                className="h-10 w-32 px-3 text-xs sm:text-sm bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 rounded-2xl font-bold text-[#B88728] dark:text-[#E8C16D] text-center cursor-not-allowed tracking-wider shadow-xs"
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
                  onChange={(_, str) => setChallanDate(str || "")}
                  placeholder="Select Date"
                  buttonClassName="h-10 px-3 rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            {/* Challan Ref.No */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Challan Ref.No
              </label>
              <input
                type="text"
                value={challanRefNo}
                onChange={(e) => setChallanRefNo(e.target.value)}
                placeholder="Optional Ref No"
                className="h-10 w-36 px-3.5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all shadow-xs"
              />
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
                    { value: "Sales", label: "Sales" },
                    { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
                    ...(challanFor && !["Sales", "Borrow (Uchhina)", "Other"].includes(challanFor)
                      ? [{ value: challanFor, label: challanFor }]
                      : []),
                    { value: "Other", label: "+ Other (Enter custom value)" },
                  ]}
                  buttonClassName="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  menuClassName="min-w-[160px]"
                />
              )}
            </div>

            {/* Stock Out From */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Stock Out From
              </label>
              <ThemeSelectDropdown
                value={stockOutFrom}
                onChange={setStockOutFrom}
                options={[
                  { value: "General", label: "General" },
                  { value: "Main Godown", label: "Main Godown" },
                  { value: "Warehouse 1", label: "Warehouse 1" },
                ]}
                buttonClassName="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                menuClassName="min-w-[160px]"
              />
            </div>
          </div>

          {/* Consignee Name */}
          <div className="flex items-center gap-2 rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 px-3.5 py-2 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Consignee:</span>
            <span className="font-bold text-[#0A0E1A] dark:text-white">{consigneeName}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3/4 Columns: Challan Details */}
        <div className="lg:col-span-3">
          <ChallanItemsTable
            items={items}
            onChangeItems={setItems}
            deliveryBy={deliveryBy}
            onChangeDeliveryBy={setDeliveryBy}
            preparedBy={preparedBy}
            onChangePreparedBy={setPreparedBy}
            deliveryTerms={deliveryTerms}
            onChangeDeliveryTerms={setDeliveryTerms}
          />
        </div>

        {/* Right 1/4 Column: Party Details [Debtors] */}
        <div className="lg:col-span-1">
          <PartyDetailsSection
            selectedParty={selectedParty}
            onSelectParty={setSelectedParty}
            onOpenLedgerModal={() => setLedgerModalOpen(true)}
          />
        </div>
      </div>

      {/* Ledger Book Modal Popup */}
      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        onPartyCreated={(party) => {
          setSelectedParty(party);
        }}
      />
    </div>
  );
});

export default ChallanForm;
