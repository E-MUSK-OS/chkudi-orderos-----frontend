"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SalariedEmployee } from "../types/salariedEmployee.types";

interface SalariedEmployeeTableProps {
  employees: SalariedEmployee[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  visibleColumns: Record<string, boolean>;
  currentPage: number;
  pageSize: number;
  pagination?: React.ReactNode;
}

function formatDateDisplay(val?: string | null): string {
  if (!val) return "—";
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return val;
  }
}

function formatCurrency(amount?: number | null): string {
  const val = Number(amount || 0);
  return `₹ ${val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SalariedEmployeeTable({
  employees,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  visibleColumns,
  currentPage,
  pageSize,
  pagination,
}: SalariedEmployeeTableProps) {
  const router = useRouter();
  const isVisible = (key: string) => visibleColumns[key] !== false;

  const allSelected =
    employees.length > 0 && selectedIds.length === employees.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < employees.length;

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm relative overflow-visible font-sans">
      <div className="w-full overflow-x-auto rounded-t-2xl sm:rounded-t-3xl">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header matching OrderOS standard & Employee Profile */}
          <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] select-none">
            <tr>
              {/* No. */}
              {isVisible("no") && (
                <th className="whitespace-nowrap py-3.5 px-3 w-12 text-center font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">
                  No.
                </th>
              )}

              {/* Checkbox */}
              {isVisible("checkbox") && (
                <th className="whitespace-nowrap py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-slate-900 accent-[#B88728] dark:border-white/20 dark:bg-[#161B24] dark:accent-[#E8C16D] cursor-pointer"
                  />
                </th>
              )}

              {/* Name */}
              {isVisible("name") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[200px]">
                  Name.
                </th>
              )}

              {/* Worker Code */}
              {isVisible("workerCode") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[120px]">
                  Worker Code.
                </th>
              )}

              {/* Joining Date */}
              {isVisible("joiningDate") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[120px]">
                  Joining Date.
                </th>
              )}

              {/* Contact No */}
              {isVisible("contactNo") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[120px]">
                  Contact No.
                </th>
              )}

              {/* Departments */}
              {isVisible("departments") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[120px]">
                  Departments.
                </th>
              )}

              {/* Designation */}
              {isVisible("designation") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[120px]">
                  Designation.
                </th>
              )}

              {/* Bank Details */}
              {isVisible("bankDetails") && (
                <th className="whitespace-nowrap py-3.5 px-4 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[180px]">
                  Bank Details.
                </th>
              )}

              {/* Basic Salary */}
              {isVisible("basicSalary") && (
                <th className="whitespace-nowrap py-3.5 px-4 text-right font-semibold text-[#6A4D1D] dark:text-[#E8C16D] min-w-[120px]">
                  Basic Salary.
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs font-sans">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[#B88728] dark:text-[#E8C16D]" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading salaried employees...</span>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
                  No Salaried Employees Found
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => {
                const rowNo = (currentPage - 1) * pageSize + index + 1;
                const isSelected = selectedIds.includes(emp.id);

                return (
                  <tr
                    key={emp.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "INPUT") return;
                      router.push(`/dashboard/setting/manage-company/salaried-employee/${emp.id}`);
                    }}
                    className={`transition-colors hover:bg-[#FFFDF8] dark:hover:bg-white/[0.02] cursor-pointer ${
                      isSelected ? "bg-amber-500/10 dark:bg-white/[0.04]" : ""
                    }`}
                  >
                    {/* No. */}
                    {isVisible("no") && (
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowNo}
                      </td>
                    )}

                    {/* Checkbox */}
                    {isVisible("checkbox") && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(emp.id)}
                          className="w-4 h-4 rounded border-slate-300 bg-white text-slate-900 accent-[#B88728] dark:border-white/20 dark:bg-[#161B24] dark:accent-[#E8C16D] cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Name (clickable link to open detail page) */}
                    {isVisible("name") && (
                      <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                        <Link
                          href={`/dashboard/setting/manage-company/salaried-employee/${emp.id}`}
                          className="hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:underline transition-colors cursor-pointer"
                          title="Click to view/edit salary details & absent hours"
                        >
                          {emp.fullName}
                        </Link>
                      </td>
                    )}

                    {/* Worker Code */}
                    {isVisible("workerCode") && (
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-400 font-mono text-[11px]">
                        {emp.machineCode || emp.workerProcess || "—"}
                      </td>
                    )}

                    {/* Joining Date */}
                    {isVisible("joiningDate") && (
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                        {formatDateDisplay(emp.joiningDate)}
                      </td>
                    )}

                    {/* Contact No */}
                    {isVisible("contactNo") && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {emp.contactNo || "—"}
                      </td>
                    )}

                    {/* Departments */}
                    {isVisible("departments") && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {emp.department || "—"}
                      </td>
                    )}

                    {/* Designation */}
                    {isVisible("designation") && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {emp.designation || "—"}
                      </td>
                    )}

                    {/* Bank Details (2 lines matching Image 1) */}
                    {isVisible("bankDetails") && (
                      <td className="py-2.5 px-4 text-[11px] leading-tight">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          Name. {emp.bankName || "—"}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mt-0.5">
                          A/C No. {emp.accountNumber || "—"}
                        </div>
                      </td>
                    )}

                    {/* Basic Salary (right-aligned ₹ currency) */}
                    {isVisible("basicSalary") && (
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {formatCurrency(emp.basicSalary)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  );
}
