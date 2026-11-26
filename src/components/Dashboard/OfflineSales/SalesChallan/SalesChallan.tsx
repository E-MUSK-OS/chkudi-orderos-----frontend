"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
import DashboardLayout from "../../layout/DashboardLayout";
import ChallanHeader from "./components/ChallanHeader";
import ChallanStats from "./components/ChallanStats";
import ChallanFilters from "./components/ChallanFilters";
import ChallanTable from "./components/ChallanTable";
import ChallanForm, { ChallanFormHandle } from "./components/ChallanForm";
import DeleteChallanModal from "./components/DeleteChallanModal";
import { DeliveryChallanSheet } from "./components/ViewSalesChallanModal";
import { printHtmlInIframe } from "../SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";
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
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [challans, setChallans] = useState<ISalesChallan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<ISalesChallan | null>(
    null
  );
  const [deletingChallan, setDeletingChallan] = useState<ISalesChallan | null>(
    null
  );
  const [printData, setPrintData] = useState<{
    challan: ISalesChallan;
    company: Company | null;
  } | null>(null);
  const challanPrintRef = useRef<HTMLDivElement>(null);
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
      const gap = 24; // gap-4 sm:gap-6
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
  // 1. When scrolling down, outer page scrolls until ChallanHeader and ChallanStats are hidden and stops at the fixed position (ChallanFilters + ChallanTable).
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals ChallanStats and ChallanHeader.
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

  useEffect(() => {
    if (!printData || !challanPrintRef.current) return;
    const timer = setTimeout(() => {
      if (challanPrintRef.current) {
        printHtmlInIframe(
          challanPrintRef.current.innerHTML,
          `Delivery Challan - ${printData.challan.challanNo}`
        );
      }
      setPrintData(null);
    }, 100);
    return () => clearTimeout(timer);
  }, [printData]);

  const handleView = (challan: ISalesChallan) => {
    router.push(`/sales/sales-challan/view/${challan.id}`);
  };

  const handlePrint = async (challan: ISalesChallan) => {
    try {
      const [chRes, compRes] = await Promise.allSettled([
        challanService.getChallanById(challan.id),
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
      toast.error(err?.message || "Failed to prepare challan for printing.");
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
      <div ref={containerRef} className="flex flex-col gap-6 font-sans">
        {/* Top Header */}
        <div className="shrink-0">
          <ChallanHeader
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
            {/* SaaS Metrics Stats Cards */}
            <div className="shrink-0">
              <ChallanStats challans={challans} />
            </div>

            {/* Lower Section (ChallanFilters + ChallanTable) */}
            <div
              className="flex flex-col gap-4 sm:gap-6 min-h-0"
              style={{
                maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
              }}
            >
              {/* Filter Bar */}
              <div ref={filterBarRef} className="shrink-0">
                <ChallanFilters
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
                <ChallanTable
                  challans={challans}
                  loading={loading}
                  tableContainerRef={tableContainerRef}
                  selectedIds={selectedChallanIds}
                  onSelectionChange={setSelectedChallanIds}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onView={handleView}
                  onPrint={handlePrint}
                />
              </div>
            </div>
          </>
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

        {/* Hidden Printable Delivery Challan Container */}
        {printData && (
          <div ref={challanPrintRef} className="hidden">
            <DeliveryChallanSheet challan={printData.challan} company={printData.company} />
          </div>
        )}

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
