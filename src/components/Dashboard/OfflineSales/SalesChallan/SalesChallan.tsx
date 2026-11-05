"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import ChallanHeader from "./components/ChallanHeader";
import ChallanStats from "./components/ChallanStats";
import ChallanFilters from "./components/ChallanFilters";
import ChallanTable from "./components/ChallanTable";
import ChallanForm, { ChallanFormHandle } from "./components/ChallanForm";
import DeleteChallanModal from "./components/DeleteChallanModal";
import ViewSalesChallanModal from "./components/ViewSalesChallanModal";
import {
  SalesChallan as ISalesChallan,
  ChallanFiltersState,
} from "./types/challan.types";
import { challanService } from "./services/challan.service";
import {
  downloadChallansExcel,
  downloadSkuWiseExcel,
} from "./utils/excelHelper";
import { toast } from "sonner";

export default function SalesChallan() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [challans, setChallans] = useState<ISalesChallan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<ISalesChallan | null>(
    null
  );
  const [deletingChallan, setDeletingChallan] = useState<ISalesChallan | null>(
    null
  );
  const [viewingChallan, setViewingChallan] = useState<ISalesChallan | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);

  // Filters State
  const [filters, setFilters] = useState<ChallanFiltersState>({
    search: "",
    challanNo: "",
    challanRefNo: "",
    partyName: "",
    productSku: "",
    startDate: "",
    endDate: "",
    invoiceStatus: "All",
    challanFor: "All",
  });

  // Form Ref for Save Trigger
  const formRef = useRef<ChallanFormHandle>(null);
  const [isSaving, setIsSaving] = useState(false);
  const filtersRef = useRef(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchChallans = useCallback(
    async (customFilters?: ChallanFiltersState) => {
      try {
        setLoading(true);
        const activeFilters = customFilters || filtersRef.current;
        const res = await challanService.getChallans(activeFilters);
        setChallans(res.data || []);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load challans.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const handleFilterChange = (
    field: keyof ChallanFiltersState,
    value: string
  ) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If input is cleared or dropdown is changed: fetch immediately!
    if (
      value.trim() === "" ||
      field === "invoiceStatus" ||
      field === "challanFor"
    ) {
      fetchChallans(nextFilters);
    } else {
      // Debounce auto-search when typing
      debounceTimerRef.current = setTimeout(() => {
        fetchChallans(nextFilters);
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
    fetchChallans(nextFilters);
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
    const defaultFilters: ChallanFiltersState = {
      search: "",
      challanNo: "",
      challanRefNo: "",
      partyName: "",
      productSku: "",
      startDate: "",
      endDate: "",
      invoiceStatus: "All",
      challanFor: "All",
    };
    setFilters(defaultFilters);
    filtersRef.current = defaultFilters;
    fetchChallans(defaultFilters);
  };

  const handleAddNew = () => {
    setSelectedChallan(null);
    setViewMode("create");
  };

  const handleEdit = async (challan: ISalesChallan) => {
    setSelectedChallan(challan);
    setViewMode("edit");
    try {
      const res = await challanService.getChallanById(challan.id);
      if (res?.data) {
        setSelectedChallan(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch fresh challan details:", err);
    }
  };

  const handleView = async (challan: ISalesChallan) => {
    setViewingChallan(challan);
    try {
      const res = await challanService.getChallanById(challan.id);
      if (res?.data) {
        setViewingChallan(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch fresh challan details:", err);
    }
  };

  const handleDeleteClick = (challan: ISalesChallan) => {
    setDeletingChallan(challan);
  };

  const handleConfirmDelete = async () => {
    if (!deletingChallan) return;
    try {
      setIsDeleting(true);
      await challanService.deleteChallan(deletingChallan.id);
      toast.success(
        `Sales Challan ${deletingChallan.challanNo} deleted successfully.`
      );
      setDeletingChallan(null);
      fetchChallans();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete sales challan.");
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
      toast.info("No challans available to download.");
      return;
    }
    const challansToExport =
      selectedChallanIds.length > 0
        ? challans.filter((c) => selectedChallanIds.includes(c.id))
        : challans;
    downloadChallansExcel(challansToExport);
    toast.success(
      selectedChallanIds.length > 0
        ? `Downloaded ${selectedChallanIds.length} Selected Challan(s) Excel`
        : "Sales Challans excel downloaded."
    );
  };

  const handleDownloadSkuWise = () => {
    if (challans.length === 0) {
      toast.info("No challans available to download.");
      return;
    }
    const challansToExport =
      selectedChallanIds.length > 0
        ? challans.filter((c) => selectedChallanIds.includes(c.id))
        : challans;
    downloadSkuWiseExcel(challansToExport);
    toast.success(
      selectedChallanIds.length > 0
        ? `Downloaded ${selectedChallanIds.length} Selected Challan(s) SKU Wise Excel`
        : "SKU Wise Challans excel downloaded."
    );
  };

  return (
    <DashboardLayout title="Sales Challan">
      <div className="space-y-6 font-sans">
        {/* Top Header */}
        <ChallanHeader
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
          <div className="space-y-6">
            {/* SaaS Metrics Stats Cards */}
            <ChallanStats challans={challans} />

            {/* Filter Bar */}
            <ChallanFilters
              filters={filters}
              onChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onSearch={handleSearchClick}
              onReset={handleResetFilters}
            />

            {/* Table */}
            <ChallanTable
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
          <ChallanForm
            ref={formRef}
            challan={selectedChallan}
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
          />
        )}

        {/* View Details Modal */}
        <ViewSalesChallanModal
          open={!!viewingChallan}
          challan={viewingChallan}
          onClose={() => setViewingChallan(null)}
          onEdit={handleEdit}
        />

        {/* Delete Confirmation Modal */}
        <DeleteChallanModal
          open={!!deletingChallan}
          challanNo={deletingChallan?.challanNo}
          partyName={deletingChallan?.partyName}
          type="Sales"
          loading={isDeleting}
          onClose={() => setDeletingChallan(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
