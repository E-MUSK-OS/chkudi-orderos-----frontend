"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import EmployeeProfileHeader from "./components/EmployeeProfileHeader";
import EmployeeProfileFilterBar from "./components/EmployeeProfileFilterBar";
import EmployeeProfileTable from "./components/EmployeeProfileTable";
import EmployeeProfilePagination from "./components/EmployeeProfilePagination";
import PrintIdCardModal from "./components/PrintIdCardModal";
import DeleteEmployeeModal from "./components/DeleteEmployeeModal";
import {
  Employee,
  EmployeeFilterState,
  EmployeeColumnConfig,
} from "./types/employee.types";
import { employeeService } from "./services/employee.service";
import { toast } from "sonner";

const DEFAULT_COLUMNS: EmployeeColumnConfig[] = [
  { key: "no", label: "No.", visible: true },
  { key: "name", label: "Name.", visible: true },
  { key: "employeeId", label: "Employee Id.", visible: true },
  { key: "designation", label: "Designation.", visible: true },
  { key: "departments", label: "Departments.", visible: true },
  { key: "machineCode", label: "Machine Code.", visible: true },
  { key: "contactNo", label: "Contact No.", visible: true },
  { key: "aadhaarNo", label: "Aadhaar No.", visible: true },
  { key: "status", label: "Status.", visible: true },
  { key: "addedEditedBy", label: "Added / Edited By", visible: true },
  { key: "actions", label: "Actions", visible: true },
];

export default function EmployeeProfile() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column visibility
  const [columns, setColumns] = useState<EmployeeColumnConfig[]>(DEFAULT_COLUMNS);

  // Filters State
  const [filters, setFilters] = useState<EmployeeFilterState>({
    search: "",
    employeeName: "",
    machineCode: "",
    status: "all",
    department: "all",
    page: 1,
    pageSize: 20,
  });

  // Modals state
  const [selectedForPrint, setSelectedForPrint] = useState<Employee | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [selectedForDelete, setSelectedForDelete] = useState<Employee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await employeeService.getEmployees(filters);
      setEmployees(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load employees.");
      setEmployees([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleFilterChange = (updates: Partial<EmployeeFilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      employeeName: "",
      machineCode: "",
      status: "all",
      department: "all",
      page: 1,
      pageSize: 20,
    });
  };

  const handleToggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Actions
  const handleOpenPrint = (employee: Employee) => {
    setSelectedForPrint(employee);
    setIsPrintModalOpen(true);
  };

  const handleOpenDelete = (employee: Employee) => {
    setSelectedForDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setIsDeleting(true);
      await employeeService.deleteEmployee(selectedForDelete.id);
      setIsDeleteModalOpen(false);
      setSelectedForDelete(null);
      toast.success("Employee deleted successfully.");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete employee.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Employee Profile">
      <div
        ref={containerRef}
        className="w-full flex flex-col gap-4 font-sans text-slate-900 dark:text-slate-100 min-h-0 max-w-[1600px] mx-auto"
        style={{
          maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        {/* Header */}
        <div ref={headerCardRef} className="shrink-0">
          <EmployeeProfileHeader />
        </div>

        {/* Filter Bar */}
        <div ref={filterBarRef} className="shrink-0">
          <EmployeeProfileFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            columns={columns}
            onToggleColumn={handleToggleColumn}
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="shrink-0 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Employees Table */}
        <div
          className="flex flex-col min-h-0"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <EmployeeProfileTable
            employees={employees}
            isLoading={isLoading}
            page={filters.page}
            pageSize={filters.pageSize}
            columns={columns}
            onPrintIdCard={handleOpenPrint}
            onDeleteEmployee={handleOpenDelete}
            tableContainerRef={tableContainerRef}
            pagination={
              total > 0 ? (
                <EmployeeProfilePagination
                  page={filters.page}
                  pageSize={filters.pageSize}
                  total={total}
                  onPageChange={(p) => handleFilterChange({ page: p })}
                  onPageSizeChange={(s) => handleFilterChange({ pageSize: s, page: 1 })}
                />
              ) : null
            }
          />
        </div>

        {/* Print ID Card Modal */}
        <PrintIdCardModal
          employee={selectedForPrint}
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedForPrint(null);
          }}
        />

        {/* Delete Employee Modal */}
        <DeleteEmployeeModal
          employee={selectedForDelete}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedForDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
