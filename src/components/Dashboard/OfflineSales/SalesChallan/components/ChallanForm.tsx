"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* OC Challan No */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                OC Challan No
              </label>
              <input
                type="text"
                readOnly
                value={challanNo}
                className="h-9 w-32 px-3 text-xs bg-[#FFF9EC] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/50 rounded-xl font-bold text-[#B88728] dark:text-[#E8C16D] text-center cursor-not-allowed tracking-wider shadow-xs"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Date
              </label>
              <div className="w-36">
                <DatePicker
                  value={challanDate}
                  onChange={(_, str) => setChallanDate(str || "")}
                  placeholder="Select Date"
                  buttonClassName="h-9 px-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Challan Ref.No */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Challan Ref.No
              </label>
              <input
                type="text"
                value={challanRefNo}
                onChange={(e) => setChallanRefNo(e.target.value)}
                placeholder="Optional Ref No"
                className="h-9 w-36 px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
              />
            </div>

            {/* Challan For */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Challan For
              </label>
              <ThemeSelectDropdown
                value={challanFor}
                onChange={setChallanFor}
                options={[
                  { value: "Sales", label: "Sales" },
                  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
                  { value: "Other", label: "Other" },
                ]}
                buttonClassName="h-9 px-3 text-xs font-normal rounded-xl"
                menuClassName="min-w-[150px]"
              />
            </div>

            {/* Stock Out From */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
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
                buttonClassName="h-9 px-3 text-xs font-normal rounded-xl"
                menuClassName="min-w-[150px]"
              />
            </div>
          </div>

          {/* Consignee Name */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-[#E7E0D2] dark:border-white/[0.08] px-3.5 py-2 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Consignee:</span>
            <span className="font-bold text-slate-900 dark:text-white">{consigneeName}</span>
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
