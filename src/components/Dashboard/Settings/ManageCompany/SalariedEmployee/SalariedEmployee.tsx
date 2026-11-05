"use client";

import React, { useState, useEffect, useCallback } from "react";
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
      <div className="w-full space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-8">
        {/* Header matching Employee Profile style */}
        <SalariedEmployeeHeader
          onDownloadTemplate={handleDownloadTemplate}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

        {/* Filter Bar */}
        <SalariedEmployeeFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          availableColumns={AVAILABLE_COLUMNS}
        />

        {/* Salaried Employees Table */}
        <SalariedEmployeeTable
          employees={employees}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          visibleColumns={visibleColumns}
          currentPage={filters.page}
          pageSize={filters.pageSize}
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
