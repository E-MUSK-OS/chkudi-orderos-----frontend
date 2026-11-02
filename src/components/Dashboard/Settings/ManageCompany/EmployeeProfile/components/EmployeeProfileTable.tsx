"use client";

import React from "react";
import Link from "next/link";
import {
  Eye,
  Edit3,
  Trash2,
  Printer,
  User,
  Calendar,
  PenTool,
  Loader2,
} from "lucide-react";
import {
  Employee,
  EmployeeColumnConfig,
} from "../types/employee.types";
import { getMediaUrl } from "@/lib/utils";

interface EmployeeProfileTableProps {
  employees: Employee[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  columns: EmployeeColumnConfig[];
  onPrintIdCard: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  pagination?: React.ReactNode;
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (_) {
    return null;
  }
}

export default function EmployeeProfileTable({
  employees,
  isLoading,
  page,
  pageSize,
  columns,
  onPrintIdCard,
  onDeleteEmployee,
  pagination,
}: EmployeeProfileTableProps) {
  const isVisible = (key: string) => {
    const col = columns.find((c) => c.key === key);
    return col ? col.visible : true;
  };

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm overflow-hidden font-sans">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header matching OrderOS standard */}
          <thead className="bg-[#0A0E1A] dark:bg-[#080B11] text-xs font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08] select-none">
            <tr>
              {isVisible("no") && (
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold text-[#E8C16D] w-12">No.</th>
              )}
              {isVisible("name") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Name.</th>
              )}
              {isVisible("employeeId") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Employee Id.</th>
              )}
              {isVisible("designation") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Designation.</th>
              )}
              {isVisible("departments") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Departments.</th>
              )}
              {isVisible("machineCode") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Machine Code.</th>
              )}
              {isVisible("contactNo") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Contact No.</th>
              )}
              {isVisible("aadhaarNo") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Aadhaar No.</th>
              )}
              {isVisible("status") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Status.</th>
              )}
              {isVisible("addedEditedBy") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#E8C16D]">Added / Edited By</th>
              )}
              {isVisible("actions") && (
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold text-[#E8C16D] w-32">Actions</th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[#F5C451]" />
                    <span className="text-xs font-medium">Loading employee records...</span>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
                  No Employee Records Found
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => {
              const rowNumber = (page - 1) * pageSize + index + 1;
              const creatorName = emp.updatedByName || emp.createdByName || null;
              const dateFormatted = formatDate(emp.updatedAt || emp.createdAt);
              const isEdited = Boolean(emp.updatedByName);

              return (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors group"
                >
                  {/* Row Number */}
                  {isVisible("no") && (
                    <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
                      {rowNumber}
                    </td>
                  )}

                  {/* Name + Logo Avatar */}
                  {isVisible("name") && (
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-[#E7E0D2] dark:bg-slate-800/80 dark:border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {emp.photoUrl ? (
                            <img
                              src={getMediaUrl(emp.photoUrl)}
                              alt={emp.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/setting/manage-company/employee-profile/view/${emp.id}`}
                            className="font-semibold text-slate-900 dark:text-white tracking-wide hover:text-[#B88728] dark:hover:text-[#F5C451] transition-colors cursor-pointer"
                          >
                            {emp.fullName}
                          </Link>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Employee ID */}
                  {isVisible("employeeId") && (
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                      {emp.employeeId}
                    </td>
                  )}

                  {/* Designation */}
                  {isVisible("designation") && (
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium text-xs">
                      {emp.designation}
                    </td>
                  )}

                  {/* Department */}
                  {isVisible("departments") && (
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium text-xs">
                      {emp.department}
                    </td>
                  )}

                  {/* Machine Code */}
                  {isVisible("machineCode") && (
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {emp.machineCode || "—"}
                    </td>
                  )}

                  {/* Contact No */}
                  {isVisible("contactNo") && (
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {emp.contactNo}
                    </td>
                  )}

                  {/* Aadhaar No */}
                  {isVisible("aadhaarNo") && (
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {emp.aadhaarNo || "—"}
                    </td>
                  )}

                  {/* Status */}
                  {isVisible("status") && (
                    <td className="py-3.5 px-4">
                      {emp.isActive ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-0.5 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-white/[0.04] dark:border-white/[0.08] px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                  )}

                  {/* Added / Edited By */}
                  {isVisible("addedEditedBy") && (
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {creatorName || dateFormatted ? (
                        <div className="space-y-1 text-[11px]">
                          {creatorName && (
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-medium">
                              {isEdited ? (
                                <PenTool size={11} className="text-slate-400 shrink-0" />
                              ) : (
                                <User size={11} className="text-slate-400 shrink-0" />
                              )}
                              <span className="truncate max-w-[140px]">{creatorName}</span>
                            </div>
                          )}
                          {dateFormatted && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              <Calendar size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />
                              <span>{dateFormatted}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  )}

                  {/* Actions (View, Edit, Print ID Card, Delete) matching Ledger Book */}
                  {isVisible("actions") && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Button */}
                        <Link
                          href={`/dashboard/setting/manage-company/employee-profile/view/${emp.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#B88728] hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="View Employee Profile"
                        >
                          <Eye size={15} />
                        </Link>

                        {/* Edit Button */}
                        <Link
                          href={`/dashboard/setting/manage-company/employee-profile/edit/${emp.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50/60 dark:hover:text-amber-400 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="Edit Employee"
                        >
                          <Edit3 size={15} />
                        </Link>

                        {/* Print ID Card Button */}
                        <button
                          type="button"
                          onClick={() => onPrintIdCard(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:text-sky-400 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="Print ID Card"
                        >
                          <Printer size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDeleteEmployee(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
