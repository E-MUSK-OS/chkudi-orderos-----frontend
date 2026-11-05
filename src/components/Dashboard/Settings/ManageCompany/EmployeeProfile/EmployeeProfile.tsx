"use client";

import React, { useState, useEffect, useCallback } from "react";
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
      <div className="w-full space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-8">
        {/* Header */}
        <EmployeeProfileHeader />

        {/* Filter Bar */}
        <EmployeeProfileFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          columns={columns}
          onToggleColumn={handleToggleColumn}
        />

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Employees Table */}
        <EmployeeProfileTable
          employees={employees}
          isLoading={isLoading}
          page={filters.page}
          pageSize={filters.pageSize}
          columns={columns}
          onPrintIdCard={handleOpenPrint}
          onDeleteEmployee={handleOpenDelete}
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
