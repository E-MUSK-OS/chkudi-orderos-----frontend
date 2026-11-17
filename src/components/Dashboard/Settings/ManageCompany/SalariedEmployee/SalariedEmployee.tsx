"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import SalariedEmployeeHeader from "./components/SalariedEmployeeHeader";
import SalariedEmployeeFilterBar from "./components/SalariedEmployeeFilterBar";
import SalariedEmployeeTable from "./components/SalariedEmployeeTable";
import SalariedEmployeePagination from "./components/SalariedEmployeePagination";
import UploadAttendanceModal from "./components/UploadAttendanceModal";
import {
  SalariedEmployee as SalariedEmployeeType,
  SalariedEmployeeFilterState,
} from "./types/salariedEmployee.types";
import { salariedEmployeeService } from "./services/salariedEmployee.service";
import { downloadBlankAttendanceTemplate } from "./utils/attendanceTemplate";
import { toast } from "sonner";

const AVAILABLE_COLUMNS = [
  { key: "no", label: "No." },
  { key: "checkbox", label: "Selection Checkbox" },
  { key: "name", label: "Name." },
  { key: "workerCode", label: "Worker Code." },
  { key: "joiningDate", label: "Joining Date." },
  { key: "contactNo", label: "Contact No." },
  { key: "departments", label: "Departments." },
  { key: "designation", label: "Designation." },
  { key: "bankDetails", label: "Bank Details." },
  { key: "basicSalary", label: "Basic Salary." },
];

export default function SalariedEmployee() {
  const [employees, setEmployees] = useState<SalariedEmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, SalariedEmployeeType>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [filters, setFilters] = useState<SalariedEmployeeFilterState>({
    search: "",
    employeeName: "",
    status: "all",
    department: "all",
    page: 1,
    pageSize: 20,
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    no: true,
    checkbox: true,
    name: true,
    workerCode: true,
    joiningDate: true,
    contactNo: true,
    departments: true,
    designation: true,
    bankDetails: true,
    basicSalary: true,
  });

  // Scroll & Height coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Calculate available height on desktop (>= 1024px)
  // so the table takes only the height needed for available records,
  // up to the available viewport space, and scrolls internally if there are more records.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      setTableMaxHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = 0;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));
      const headerHeight = headerCardRef.current?.offsetHeight || 88;
      const filterBarHeight = filterBarRef.current?.offsetHeight || 60;
      const gap = 32; // 2x gap-4 (16px each)
      const maxForTable = available - headerHeight - filterBarHeight - gap;
      if (maxForTable > 150) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
    }
  }, []);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
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
  }, [employees.length, calculateHeight]);

  // Lock outer scroll at header position on desktop:
  // Since this page has Header Card + Filter Bar + Table, the Header Card stays fixed at the top,
  // outer page does not scroll, and scrolling forwards to the internal table.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = 0;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      scrollContainer.scrollTop = 0;

      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;

      // If wheel occurred over the header card or filter bar, scroll the table internally
      if (!e.composedPath().includes(tableContainer) && !tableContainer.contains(e.target as Node)) {
        tableContainer.scrollTop += e.deltaY;
      }
    };

    const onScroll = () => {
      if (window.innerWidth >= 1024 && scrollContainer.scrollTop !== 0) {
        scrollContainer.scrollTop = 0;
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: true });
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salariedEmployeeService.getSalariedEmployees(filters);
      setEmployees(res.data);
      setTotalRecords(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Failed to load salaried employees.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleFilterChange = (updates: Partial<SalariedEmployeeFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      employeeName: "",
      status: "all",
      department: "all",
      page: 1,
      pageSize: 20,
    });
  };

  const handleToggleColumn = (colKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }));
  };

  const handleToggleSelect = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        setSelectedMap((m) => {
          const n = { ...m };
          delete n[id];
          return n;
        });
        return prev.filter((item) => item !== id);
      } else {
        if (emp) setSelectedMap((m) => ({ ...m, [id]: emp }));
        return [...prev, id];
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
      setSelectedMap({});
    } else {
      setSelectedIds(employees.map((e) => e.id));
      const m: Record<string, SalariedEmployeeType> = {};
      employees.forEach((e) => {
        m[e.id] = e;
      });
      setSelectedMap(m);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      let targetEmployees: SalariedEmployeeType[] = [];

      if (selectedIds.length > 0) {
        // User selected specific records -> export only those selected
        targetEmployees = selectedIds.map((id) => selectedMap[id] || employees.find((e) => e.id === id)).filter(Boolean) as SalariedEmployeeType[];
        downloadBlankAttendanceTemplate(targetEmployees);
        toast.success(
          `Exported template for ${targetEmployees.length} selected employee(s).`
        );
      } else {
        // User did NOT select any record -> export ALL employees
        if (totalRecords > employees.length) {
          const res = await salariedEmployeeService.getSalariedEmployees({
            ...filters,
            page: 1,
            pageSize: Math.max(totalRecords, 500),
          });
          targetEmployees = res.data || [];
        } else {
          targetEmployees = employees;
        }

        downloadBlankAttendanceTemplate(targetEmployees);
        toast.success(
          targetEmployees.length > 0
            ? `Exported template for all ${targetEmployees.length} employee(s).`
            : "Exported blank template."
        );
      }
    } catch {
      const fallbackList =
        selectedIds.length > 0
          ? employees.filter((emp) => selectedIds.includes(emp.id))
          : employees;
      downloadBlankAttendanceTemplate(fallbackList);
    }
  };

  return (
    <DashboardLayout title="Salaried Employee">
      <div
        ref={containerRef}
        className="w-full flex flex-col gap-4 font-sans text-slate-900 dark:text-slate-100 min-h-0"
        style={{
          maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        {/* Header matching Employee Profile style */}
        <div ref={headerCardRef} className="shrink-0">
          <SalariedEmployeeHeader
            onDownloadTemplate={handleDownloadTemplate}
            onUploadClick={() => setIsUploadModalOpen(true)}
          />
        </div>

        {/* Filter Bar */}
        <div ref={filterBarRef} className="shrink-0">
          <SalariedEmployeeFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            availableColumns={AVAILABLE_COLUMNS}
          />
        </div>

        {/* Salaried Employees Table */}
        <div
          className="flex flex-col min-h-0"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <SalariedEmployeeTable
            employees={employees}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            visibleColumns={visibleColumns}
            currentPage={filters.page}
            pageSize={filters.pageSize}
            tableContainerRef={tableContainerRef}
            pagination={
              <SalariedEmployeePagination
                currentPage={filters.page}
                totalPages={totalPages}
                totalRecords={totalRecords}
                pageSize={filters.pageSize}
                onPageChange={(page) => handleFilterChange({ page })}
                onPageSizeChange={(pageSize) => handleFilterChange({ pageSize, page: 1 })}
              />
            }
          />
        </div>

        {/* Upload Attendance Modal */}
        <UploadAttendanceModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={fetchEmployees}
        />
      </div>
    </DashboardLayout>
  );
}
