"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import PurchaseChallanHeader from "./components/PurchaseChallanHeader";
import PurchaseChallanStats from "./components/PurchaseChallanStats";
import PurchaseChallanFilters from "./components/PurchaseChallanFilters";
import PurchaseChallanTable from "./components/PurchaseChallanTable";
import PurchaseChallanForm, { PurchaseChallanFormHandle } from "./components/PurchaseChallanForm";
import DeletePurchaseChallanModal from "./components/DeletePurchaseChallanModal";
import ViewPurchaseChallanModal from "./components/ViewPurchaseChallanModal";
import {
  PurchaseChallan as IPurchaseChallan,
  PurchaseChallanFiltersState,
} from "./types/purchaseChallan.types";
import { purchaseChallanService } from "./services/purchaseChallan.service";
import {
  downloadPurchaseChallansExcel,
  downloadPurchaseSkuWiseExcel,
} from "./utils/purchaseExcelHelper";
import { toast } from "sonner";

export default function PurchaseChallan() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [challans, setChallans] = useState<IPurchaseChallan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<IPurchaseChallan | null>(
    null
  );
  const [deletingChallan, setDeletingChallan] = useState<IPurchaseChallan | null>(
    null
  );
  const [viewingChallan, setViewingChallan] = useState<IPurchaseChallan | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);

  // Filters State matching Sales Challan
  const [filters, setFilters] = useState<PurchaseChallanFiltersState>({
    search: "",
    challanNo: "",
    partyChallanNo: "",
    supplierName: "",
    productSku: "",
    startDate: "",
    endDate: "",
    invoiceStatus: "All",
    challanFor: "All",
    stockIn: "All",
  });

  // Form Ref for Save Trigger
  const formRef = useRef<PurchaseChallanFormHandle>(null);
  const [isSaving, setIsSaving] = useState(false);
  const filtersRef = useRef(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchChallans = useCallback(
    async (customFilters?: PurchaseChallanFiltersState) => {
      try {
        setLoading(true);
        const activeFilters = customFilters || filtersRef.current;
        const res = await purchaseChallanService.getChallans(activeFilters);
        setChallans(res.data || []);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load purchase challans.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    const nextFilters = { ...filters, startDate, endDate };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;
    fetchChallans(nextFilters);
  };

  const handleFilterChange = (
    field: keyof PurchaseChallanFiltersState,
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
      field === "invoiceStatus" ||
      field === "challanFor" ||
      field === "stockIn"
    ) {
      fetchChallans(nextFilters);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        fetchChallans(nextFilters);
      }, 350);
    }
  };

  const handleSearchClick = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchChallans(filtersRef.current);
  };

  const handleResetFilters = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const defaultFilters: PurchaseChallanFiltersState = {
      search: "",
      challanNo: "",
      partyChallanNo: "",
      supplierName: "",
      productSku: "",
      startDate: "",
      endDate: "",
      invoiceStatus: "All",
      challanFor: "All",
      stockIn: "All",
    };
    setFilters(defaultFilters);
    filtersRef.current = defaultFilters;
    fetchChallans(defaultFilters);
  };

  const handleAddNew = () => {
    setSelectedChallan(null);
    setViewMode("create");
  };

  const handleEdit = async (challan: IPurchaseChallan) => {
    setSelectedChallan(challan);
    setViewMode("edit");
    try {
      const res = await purchaseChallanService.getChallanById(challan.id);
      if (res?.data) {
        setSelectedChallan(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch fresh purchase challan details:", err);
    }
  };

  const handleView = async (challan: IPurchaseChallan) => {
    setViewingChallan(challan);
    try {
      const res = await purchaseChallanService.getChallanById(challan.id);
      if (res?.data) {
        setViewingChallan(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch complete purchase challan details:", err);
    }
  };

  const handleDeleteClick = (challan: IPurchaseChallan) => {
    setDeletingChallan(challan);
  };

  const handleConfirmDelete = async () => {
    if (!deletingChallan) return;
    try {
      setIsDeleting(true);
      await purchaseChallanService.deleteChallan(deletingChallan.id);
      toast.success(
        `Purchase Challan ${deletingChallan.challanNo} deleted successfully.`
      );
      setDeletingChallan(null);
      fetchChallans();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete purchase challan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedChallan(null);
  };

  const handleSaveClick = () => {
    formRef.current?.submit();
  };

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedChallan(null);
    fetchChallans();
  };

  const handleDownloadAll = () => {
    if (challans.length === 0) {
      toast.info("No purchase challans available to download.");
      return;
    }
    const challansToExport =
      selectedChallanIds.length > 0
        ? challans.filter((c) => selectedChallanIds.includes(c.id))
        : challans;
    downloadPurchaseChallansExcel(challansToExport);
    toast.success(
      selectedChallanIds.length > 0
        ? `Downloaded ${selectedChallanIds.length} Selected Challan(s) Excel`
        : "Purchase Challans excel downloaded."
    );
  };

  const handleDownloadSkuWise = () => {
    if (challans.length === 0) {
      toast.info("No purchase challans available to download.");
      return;
    }
    const challansToExport =
      selectedChallanIds.length > 0
        ? challans.filter((c) => selectedChallanIds.includes(c.id))
        : challans;
    downloadPurchaseSkuWiseExcel(challansToExport);
    toast.success(
      selectedChallanIds.length > 0
        ? `Downloaded ${selectedChallanIds.length} Selected Challan(s) SKU Wise Excel`
        : "SKU Wise Purchase Challans excel downloaded."
    );
  };

  return (
    <DashboardLayout title="Purchase Challan">
      <div className="space-y-4 sm:space-y-5 pb-12 max-w-[1700px] mx-auto font-sans">
        {/* Top Header matching Sales Challan */}
        <PurchaseChallanHeader
          viewMode={viewMode}
          onAddNew={handleAddNew}
          onBack={handleBack}
          onSave={handleSaveClick}
          onDownloadAll={handleDownloadAll}
          onDownloadSkuWise={handleDownloadSkuWise}
          saving={isSaving}
        />

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4 sm:space-y-5">
            {/* Live Metrics */}
            <PurchaseChallanStats challans={challans} />

            {/* Filter Bar */}
            <PurchaseChallanFilters
              filters={filters}
              onChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onSearch={handleSearchClick}
              onReset={handleResetFilters}
            />

            {/* Table */}
            <PurchaseChallanTable
              challans={challans}
              loading={loading}
              selectedIds={selectedChallanIds}
              onSelectionChange={setSelectedChallanIds}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onView={handleView}
            />
          </div>
        )}

        {/* Create / Edit View */}
        {(viewMode === "create" || viewMode === "edit") && (
          <PurchaseChallanForm
            ref={formRef}
            challan={selectedChallan}
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
          />
        )}

        {/* View Details Modal */}
        <ViewPurchaseChallanModal
          open={!!viewingChallan}
          challan={viewingChallan}
          onClose={() => setViewingChallan(null)}
          onEdit={handleEdit}
        />

        {/* Delete Confirmation Modal */}
        <DeletePurchaseChallanModal
          open={!!deletingChallan}
          challanNo={deletingChallan?.challanNo}
          supplierName={deletingChallan?.supplierName}
          loading={isDeleting}
          onClose={() => setDeletingChallan(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
