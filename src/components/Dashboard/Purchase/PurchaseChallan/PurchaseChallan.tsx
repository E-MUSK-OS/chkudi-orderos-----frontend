"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
import DashboardLayout from "../../layout/DashboardLayout";
import PurchaseChallanHeader from "./components/PurchaseChallanHeader";
import PurchaseChallanStats from "./components/PurchaseChallanStats";
import PurchaseChallanFilters from "./components/PurchaseChallanFilters";
import PurchaseChallanTable from "./components/PurchaseChallanTable";
import PurchaseChallanForm, { PurchaseChallanFormHandle } from "./components/PurchaseChallanForm";
import DeletePurchaseChallanModal from "./components/DeletePurchaseChallanModal";
import { PurchaseChallanSheet } from "./components/ViewPurchaseChallanModal";
import { printHtmlInIframe } from "@/components/Dashboard/OfflineSales/SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";
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
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [challans, setChallans] = useState<IPurchaseChallan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<IPurchaseChallan | null>(
    null
  );
  const [deletingChallan, setDeletingChallan] = useState<IPurchaseChallan | null>(
    null
  );
  const [printData, setPrintData] = useState<{
    challan: IPurchaseChallan;
    company: Company | null;
  } | null>(null);
  const challanPrintRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);

  // Filters State matching Sales Challan
  const [filters, setFilters] = useState<PurchaseChallanFiltersState>({
    search: "",
    challanNo: "",
    partyChallanNo: "",
    supplierName: "",
    party: "",
    lotNo: "",
    productSku: "",
    selectedSku: "All",
    startDate: "",
    endDate: "",
    invoiceStatus: "All",
    challanFor: "All",
    stockIn: "All",
  });
  const [totalSumQty, setTotalSumQty] = useState<number | undefined>(undefined);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    no: true,
    checkbox: true,
    challanNo: true,
    lotSku: true,
    date: true,
    party: true,
    contact: true,
    partyChallanNo: true,
    totalQty: true,
    challanFor: true,
    preparedBy: true,
    status: true,
    actions: true,
  });

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: prev[columnKey] === false ? true : false,
    }));
  };

  // Table Sorting, Aggregations, and Pinning State
  const [sortField, setSortField] = useState<keyof IPurchaseChallan>("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showAggregations, setShowAggregations] = useState<boolean>(true);
  const [, setPinnedColumns] = useState<string[]>([]);

  const handleClearSorting = () => {
    setSortField("createdAt");
    setSortAsc(false);
    toast.success("Sorting cleared.");
  };

  const handleClearAggregations = () => {
    setShowAggregations((prev) => {
      const next = !prev;
      toast.success(next ? "Aggregations enabled." : "Aggregations cleared.");
      return next;
    });
  };

  const handleResetPinning = () => {
    setPinnedColumns([]);
    toast.success("Column pinning reset to default.");
  };

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
        if (res.meta?.totalSumQty !== undefined) {
          setTotalSumQty(res.meta.totalSumQty);
        }
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
    setFilters((prev) => {
      const nextFilters: PurchaseChallanFiltersState = {
        ...prev,
        [field]: value,
        ...(field === "selectedSku"
          ? {
              selectedSku: value,
              productSku: value === "All" ? "" : value,
            }
          : field === "productSku"
          ? {
              productSku: value,
              selectedSku: value === "" ? "All" : prev.selectedSku,
            }
          : field === "party"
          ? {
              party: value,
              supplierName: value,
            }
          : {}),
      };
      filtersRef.current = nextFilters;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const isImmediate =
        value.trim() === "" ||
        field === "invoiceStatus" ||
        field === "challanFor" ||
        field === "stockIn" ||
        field === "selectedSku";

      if (isImmediate) {
        fetchChallans(nextFilters);
      } else {
        debounceTimerRef.current = setTimeout(() => {
          fetchChallans(nextFilters);
        }, 350);
      }

      return nextFilters;
    });
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
      party: "",
      lotNo: "",
      productSku: "",
      selectedSku: "All",
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

  useEffect(() => {
    if (!printData || !challanPrintRef.current) return;
    const timer = setTimeout(() => {
      if (challanPrintRef.current) {
        printHtmlInIframe(
          challanPrintRef.current.innerHTML,
          `Purchase Challan - ${printData.challan.challanNo}`
        );
      }
      setPrintData(null);
    }, 100);
    return () => clearTimeout(timer);
  }, [printData]);

  const handleView = (challan: IPurchaseChallan) => {
    router.push(`/purchase/finish-goods/challan/view/${challan.id}`);
  };

  const handlePrint = async (challan: IPurchaseChallan) => {
    try {
      const [chRes, compRes] = await Promise.allSettled([
        purchaseChallanService.getChallanById(challan.id),
        companyService.getCompanies({ pageSize: 20 }),
      ]);

      let preferredCompany: Company | null = null;
      if (compRes.status === "fulfilled" && compRes.value?.data?.length) {
        const companies = compRes.value.data;
        preferredCompany =
          companies.find((c) => c.isDefault && c.status === "ACTIVE") ||
          companies.find((c) => c.isDefault) ||
          companies.find((c) => c.status === "ACTIVE") ||
          companies[0] ||
          null;
      }

      const fullChallan =
        chRes.status === "fulfilled" && chRes.value?.data ? chRes.value.data : challan;
      setPrintData({ challan: fullChallan, company: preferredCompany });
    } catch (err: any) {
      toast.error(err?.message || "Failed to prepare purchase challan for printing.");
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
    try {
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
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to download excel.");
    }
  };

  const handleDownloadSkuWise = () => {
    try {
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
    } catch (err: any) {
      console.error("Export SKU Wise error:", err);
      toast.error(err.message || "Failed to download SKU wise excel.");
    }
  };

  return (
    <DashboardLayout title="Purchase Challan">
      <div ref={containerRef} className="flex flex-col gap-4 sm:gap-5 max-w-[1700px] mx-auto font-sans">
        {/* Top Header Card matching Image */}
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
                  visibleColumns={visibleColumns}
                  onToggleColumn={handleToggleColumn}
                  onClearSorting={handleClearSorting}
                  onClearAggregations={handleClearAggregations}
                  onResetPinning={handleResetPinning}
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
                  onPrint={handlePrint}
                  totalSumQty={totalSumQty}
                  visibleColumns={visibleColumns}
                  sortField={sortField}
                  sortAsc={sortAsc}
                  onSortChange={(field, asc) => {
                    setSortField(field);
                    setSortAsc(asc);
                  }}
                  showAggregations={showAggregations}
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

        {/* Hidden Printable Purchase Challan Container */}
        {printData && (
          <div ref={challanPrintRef} className="hidden">
            <PurchaseChallanSheet challan={printData.challan} company={printData.company} />
          </div>
        )}

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
