"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
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

  // Scrolling coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Calculate remaining viewport height for desktop (>= 1024px)
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined") return;
    const isLg = window.innerWidth >= 1024;
    setIsDesktop(isLg);
    if (!isLg) {
      setTargetHeight(null);
      setTableMaxHeight(null);
      return;
    }

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;

    if (available > 320) {
      setTargetHeight(Math.floor(available));
      const filtersHeight = filterBarRef.current?.offsetHeight || 60;
      const gap = 20; // gap-4 sm:gap-5
      const maxForTable = available - filtersHeight - gap;
      if (maxForTable > 150) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  useEffect(() => {
    calculateHeight();
  }, [challans.length, calculateHeight]);

  // Seamless scroll coordinator:
  // 1. When scrolling down, outer page scrolls until PurchaseChallanHeader and PurchaseChallanStats are hidden and stops at the fixed position (PurchaseChallanFilters + PurchaseChallanTable).
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals PurchaseChallanStats and PurchaseChallanHeader.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      coordinateTableWheelScroll({
        e,
        scrollContainer,
        tableContainer: tableContainerRef.current,
      });
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

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
      <div ref={containerRef} className="flex flex-col gap-4 sm:gap-5 max-w-[1700px] mx-auto font-sans">
        {/* Top Header matching Sales Challan */}
        <div className="shrink-0">
          <PurchaseChallanHeader
            viewMode={viewMode}
            onAddNew={handleAddNew}
            onBack={handleBack}
            onSave={handleSaveClick}
            onDownloadAll={handleDownloadAll}
            onDownloadSkuWise={handleDownloadSkuWise}
            saving={isSaving}
          />
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <>
            {/* Live Metrics */}
            <div className="shrink-0">
              <PurchaseChallanStats challans={challans} />
            </div>

            {/* Lower Section (PurchaseChallanFilters + PurchaseChallanTable) */}
            <div
              className="flex flex-col gap-4 sm:gap-5 min-h-0"
              style={{
                maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
              }}
            >
              {/* Filter Bar */}
              <div ref={filterBarRef} className="shrink-0">
                <PurchaseChallanFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  onDateRangeChange={handleDateRangeChange}
                  onSearch={handleSearchClick}
                  onReset={handleResetFilters}
                />
              </div>

              {/* Table Container */}
              <div
                className="flex flex-col min-h-0"
                style={{
                  maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
                }}
              >
                <PurchaseChallanTable
                  challans={challans}
                  loading={loading}
                  tableContainerRef={tableContainerRef}
                  selectedIds={selectedChallanIds}
                  onSelectionChange={setSelectedChallanIds}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onView={handleView}
                />
              </div>
            </div>
          </>
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
