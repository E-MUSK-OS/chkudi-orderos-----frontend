"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
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

    // Ledger Book Modal State
    const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

    // Sync on initial / prop change
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
        setSelectedSupplier(challan.supplier || null);
        setCourierPartner(challan.courierPartner || "");
        setLrNo(challan.lrNo || "");
        setReceivedBy(challan.receivedBy || "Ramesh");
        setCheckedBy(challan.checkedBy || "Ramesh");
        setPreparedBy(challan.preparedBy || "Ramesh");
        if (challan.items && challan.items.length > 0) {
          setItems(
            challan.items.map((it) => ({
              ...it,
              name: it.name && it.name.trim() !== it.sku?.trim() ? it.name : "",
            }))
          );
        }
      } else {
        purchaseChallanService.getNextChallanNo().then((nextNo) => {
          setChallanNo(nextNo);
        });
      }
    }, [challan]);


    // Handle Form Submission
    const handleSubmit = async () => {
      if (!selectedSupplier && !challan?.supplierName) {
        toast.error("Please select a supplier [Sundry Creditor].");
        return;
      }

      const validItems = items.filter((it) => it.sku && it.sku.trim().length > 0);
      if (validItems.length === 0) {
        toast.error("Please add at least one item with a valid product SKU.");
        return;
      }

      try {
        setIsSaving(true);

        const itemPartyChallanNos = Array.from(
          new Set(
            validItems
              .map((it) => it.partyChallanNo?.trim())
              .filter((no): no is string => Boolean(no && no.length > 0))
          )
        );
        const derivedPartyChallanNo =
          itemPartyChallanNos.length > 0 ? itemPartyChallanNos.join(", ") : null;

        const payload = {
          challanNo: challanNo.trim(),
          partyChallanNo: derivedPartyChallanNo || challan?.partyChallanNo || null,
          supplierId: selectedSupplier?.id || null,
          supplierName: selectedSupplier?.partyName || challan?.supplierName || "Supplier",
          contactNo: selectedSupplier?.phone || challan?.contactNo || null,
          challanDate,
          partyChallanDate,
          challanFor,
          stockIn,
          courierPartner: courierPartner || null,
          lrNo: lrNo || null,
          receivedBy: receivedBy || "Ramesh",
          checkedBy: checkedBy || "Ramesh",
          preparedBy: preparedBy || "Ramesh",
          items: validItems.map((it, idx) => ({
            itemNo: idx + 1,
            sku: it.sku.trim(),
            name: it.name?.trim() ? it.name.trim() : "",
            orderedQty: Number(it.orderedQty) || 0,
            receivedQty: Number(it.receivedQty) || 0,
            rate: Number(it.rate) || 0,
            poNo: it.poNo || null,
            partyChallanNo: it.partyChallanNo || null,
            receivedDate: it.receivedDate || null,
            remarks: it.remarks || null,
            printBarcode: it.printBarcode !== false,
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
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Challan No */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Challan No
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
                    onChange={(_, dateStr) => setChallanDate(dateStr || "")}
                    placeholder="25-10-2026"
                    buttonClassName="h-9 px-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Party Challan Date */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Party Challan Date
                </label>
                <div className="w-36">
                  <DatePicker
                    value={partyChallanDate}
                    onChange={(_, dateStr) => setPartyChallanDate(dateStr || "")}
                    placeholder="27-10-2026"
                    buttonClassName="h-9 px-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Challan For */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Challan For
                </label>
                <div className="w-36">
                  <ThemeSelectDropdown
                    value={challanFor}
                    onChange={setChallanFor}
                    options={challanForOptions}
                    buttonClassName="h-9 px-3 rounded-xl text-xs justify-between"
                    menuClassName="min-w-[150px]"
                  />
                </div>
              </div>

              {/* Stock In */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Stock In
                </label>
                <div className="w-36">
                  <ThemeSelectDropdown
                    value={stockIn}
                    onChange={setStockIn}
                    options={stockInOptions}
                    buttonClassName="h-9 px-3 rounded-xl text-xs justify-between"
                    menuClassName="min-w-[150px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Section: Exactly like Sales Challan */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left 3/4 Columns: Challan Details + Delivery & Inward Verification (One Single Section) */}
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

          {/* Right 1/4 Column: Supplier Details [Creditor] (One Single Section) */}
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
