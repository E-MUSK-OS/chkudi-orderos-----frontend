"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Save, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AbsentRecord, SalariedEmployee } from "../types/salariedEmployee.types";
import { salariedEmployeeService } from "../services/salariedEmployee.service";

interface AbsentHourRecordsCardProps {
  employee: SalariedEmployee;
  financialYear?: string;
  onRecordsChange?: () => void;
}

export interface MonthDefinition {
  index: number;
  name: string;
  defaultStart: string;
  defaultEnd: string;
  year: number;
  calendarMonth: number;
}

/**
 * Returns the list of months up to the current active month for the financial year.
 * When the month changes (e.g. October -> November), November automatically appears.
 * Any month that already has saved records is also preserved and displayed.
 */
function getVisibleMonths(
  financialYear: string = "2026-2027",
  existingRecords: AbsentRecord[] = []
): MonthDefinition[] {
  const parts = financialYear.split("-").map((p) => parseInt(p.trim(), 10));
  const startYear = isNaN(parts[0]) ? 2026 : parts[0];
  const endYear = isNaN(parts[1]) ? startYear + 1 : parts[1];

  const allMonths: MonthDefinition[] = [
    { index: 0, name: `April ${startYear}`, defaultStart: `01-04-${startYear}`, defaultEnd: `15-04-${startYear}`, year: startYear, calendarMonth: 3 },
    { index: 1, name: `May ${startYear}`, defaultStart: `01-05-${startYear}`, defaultEnd: `15-05-${startYear}`, year: startYear, calendarMonth: 4 },
    { index: 2, name: `June ${startYear}`, defaultStart: `01-06-${startYear}`, defaultEnd: `15-06-${startYear}`, year: startYear, calendarMonth: 5 },
    { index: 3, name: `July ${startYear}`, defaultStart: `01-07-${startYear}`, defaultEnd: `15-07-${startYear}`, year: startYear, calendarMonth: 6 },
    { index: 4, name: `August ${startYear}`, defaultStart: `01-08-${startYear}`, defaultEnd: `15-08-${startYear}`, year: startYear, calendarMonth: 7 },
    { index: 5, name: `September ${startYear}`, defaultStart: `01-09-${startYear}`, defaultEnd: `15-09-${startYear}`, year: startYear, calendarMonth: 8 },
    { index: 6, name: `October ${startYear}`, defaultStart: `01-10-${startYear}`, defaultEnd: `15-10-${startYear}`, year: startYear, calendarMonth: 9 },
    { index: 7, name: `November ${startYear}`, defaultStart: `01-11-${startYear}`, defaultEnd: `15-11-${startYear}`, year: startYear, calendarMonth: 10 },
    { index: 8, name: `December ${startYear}`, defaultStart: `01-12-${startYear}`, defaultEnd: `15-12-${startYear}`, year: startYear, calendarMonth: 11 },
    { index: 9, name: `January ${endYear}`, defaultStart: `01-01-${endYear}`, defaultEnd: `15-01-${endYear}`, year: endYear, calendarMonth: 0 },
    { index: 10, name: `February ${endYear}`, defaultStart: `01-02-${endYear}`, defaultEnd: `15-02-${endYear}`, year: endYear, calendarMonth: 1 },
    { index: 11, name: `March ${endYear}`, defaultStart: `01-03-${endYear}`, defaultEnd: `15-03-${endYear}`, year: endYear, calendarMonth: 2 },
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentCalMonth = now.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov, etc.

  let currentMaxIndex = 11;

  if (currentYear < startYear) {
    currentMaxIndex = 0;
  } else if (currentYear === startYear) {
    if (currentCalMonth < 3) {
      currentMaxIndex = 0;
    } else {
      currentMaxIndex = currentCalMonth - 3;
    }
  } else if (currentYear === endYear) {
    if (currentCalMonth <= 2) {
      currentMaxIndex = currentCalMonth + 9;
    } else {
      currentMaxIndex = 11;
    }
  } else {
    currentMaxIndex = 11;
  }

  // Filter months up to current active month, but ALWAYS keep any month that has saved records
  return allMonths.filter((m) => {
    if (m.index <= currentMaxIndex) return true;
    const hasRecord = existingRecords.some(
      (r) =>
        r.monthIndex === m.index ||
        r.monthName === m.name ||
        r.monthName?.toLowerCase().startsWith(m.name.toLowerCase().split(" ")[0])
    );
    return hasRecord;
  });
}

export default function AbsentHourRecordsCard({
  employee,
  financialYear = "2026-2027",
  onRecordsChange,
}: AbsentHourRecordsCardProps) {
  const [records, setRecords] = useState<AbsentRecord[]>(
    employee.absentRecords || []
  );
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(employee.absentRecords || []);
  }, [employee.absentRecords]);

  const visibleMonths = useMemo(() => {
    return getVisibleMonths(financialYear, records);
  }, [financialYear, records]);

  const handleAddNewPeriod = (monthItem: MonthDefinition) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newRecord: AbsentRecord = {
      id: tempId,
      employeeId: employee.id,
      financialYear,
      monthName: monthItem.name,
      monthIndex: monthItem.index,
      periodString: `${monthItem.defaultStart} – ${monthItem.defaultEnd}`,
      absentHours: 0,
      overtimeHours: 0,
      isNew: true,
    };

    setRecords((prev) => [...prev, newRecord]);
  };

  const handleFieldChange = (
    recordId: string,
    field: keyof AbsentRecord,
    val: any
  ) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, [field]: val } : r))
    );
  };

  const handleSaveRecord = async (rec: AbsentRecord) => {
    try {
      setLoadingRowId(rec.id);
      if (rec.isNew) {
        const saved = await salariedEmployeeService.createAbsentRecord(
          employee.id,
          {
            financialYear: rec.financialYear,
            monthName: rec.monthName,
            monthIndex: rec.monthIndex,
            periodString: rec.periodString,
            absentHours: Number(rec.absentHours || 0),
            overtimeHours: Number(rec.overtimeHours || 0),
          }
        );
        setRecords((prev) =>
          prev.map((r) => (r.id === rec.id ? { ...saved, isNew: false } : r))
        );
        toast.success(`Record for ${rec.monthName} saved successfully.`);
      } else {
        const updated = await salariedEmployeeService.updateAbsentRecord(
          employee.id,
          rec.id,
          {
            periodString: rec.periodString,
            absentHours: Number(rec.absentHours || 0),
            overtimeHours: Number(rec.overtimeHours || 0),
          }
        );
        setRecords((prev) =>
          prev.map((r) => (r.id === rec.id ? updated : r))
        );
        toast.success(`Record for ${rec.monthName} updated successfully.`);
      }
      onRecordsChange?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save absent record.");
    } finally {
      setLoadingRowId(null);
    }
  };

  const handleDeleteRecord = async (rec: AbsentRecord) => {
    if (rec.isNew) {
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
      return;
    }

    try {
      setLoadingRowId(rec.id);
      await salariedEmployeeService.deleteAbsentRecord(employee.id, rec.id);
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success("Record deleted successfully.");
      onRecordsChange?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record.");
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-sm flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EAE4D8] dark:border-white/[0.06]">
        <h2 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
          Absent Hour Records ({financialYear})
        </h2>
      </div>

      {/* Table of Months */}
      <div className="overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EAE4D8] bg-[#FAF8F5] dark:border-white/[0.08] dark:bg-[#080B11] text-[11px] font-semibold text-slate-700 dark:text-slate-300 select-none">
              <th className="py-2.5 px-3 min-w-[120px]">Month</th>
              <th className="py-2.5 px-3 min-w-[200px]">Period</th>
              <th className="py-2.5 px-3 min-w-[110px] text-center">Absent Hour</th>
              <th className="py-2.5 px-3 min-w-[110px] text-center">Overtime Hour</th>
              <th className="py-2.5 px-3 w-14 text-center">Delete</th>
              <th className="py-2.5 px-3 w-14 text-center">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE4D8]/60 dark:divide-white/[0.04]">
            {visibleMonths.map((month) => {
              const monthRecords = records.filter(
                (r) =>
                  r.monthName === month.name ||
                  r.monthIndex === month.index ||
                  r.monthName?.toLowerCase().startsWith(month.name.toLowerCase().split(" ")[0])
              );

              return (
                <React.Fragment key={month.index}>
                  {monthRecords.length === 0 ? (
                    // Month with no records yet -> shows Month name and "+ Add" button under Period
                    <tr className="hover:bg-[#FFFDF8] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {month.name}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleAddNewPeriod(month)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-700 hover:text-black dark:border-white/[0.08] dark:bg-[#080B11] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer shadow-xs active:scale-95"
                        >
                          <Plus size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
                          <span>Add</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-600">—</td>
                      <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-600">—</td>
                      <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-600">—</td>
                      <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-600">—</td>
                    </tr>
                  ) : (
                    // Month with 1 or more period records
                    monthRecords.map((rec, rIdx) => {
                      const isSaving = loadingRowId === rec.id;
                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-[#FFFDF8] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Month Name (shown on first row of month) */}
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 align-top">
                            {rIdx === 0 ? month.name : ""}
                          </td>

                          {/* Period */}
                          <td className="py-2.5 px-3">
                            <div className="space-y-1.5">
                              <div className="relative">
                                <Calendar
                                  size={13}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B88728] dark:text-[#E8C16D]"
                                />
                                <input
                                  type="text"
                                  value={rec.periodString || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      rec.id,
                                      "periodString",
                                      e.target.value
                                    )
                                  }
                                  placeholder="DD-MM-YYYY – DD-MM-YYYY"
                                  className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white font-mono outline-none transition-all shadow-xs"
                                />
                              </div>

                              {/* If last row of this month, show + Add button below */}
                              {rIdx === monthRecords.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleAddNewPeriod(month)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-700 hover:text-black dark:border-white/[0.08] dark:bg-[#080B11] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <Plus size={11} className="text-[#B88728] dark:text-[#E8C16D]" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Absent Hour */}
                          <td className="py-2.5 px-3 text-center align-top">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={rec.absentHours === 0 ? "" : rec.absentHours}
                              onChange={(e) =>
                                handleFieldChange(
                                  rec.id,
                                  "absentHours",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Absent Hr"
                              className="w-24 h-8 px-2 text-xs text-center rounded-lg bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white dark:placeholder-slate-500 font-mono outline-none transition-all shadow-xs mx-auto block"
                            />
                          </td>

                          {/* Overtime Hour */}
                          <td className="py-2.5 px-3 text-center align-top">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={rec.overtimeHours === 0 ? "" : rec.overtimeHours}
                              onChange={(e) =>
                                handleFieldChange(
                                  rec.id,
                                  "overtimeHours",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Overtime Hr"
                              className="w-24 h-8 px-2 text-xs text-center rounded-lg bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white dark:placeholder-slate-500 font-mono outline-none transition-all shadow-xs mx-auto block"
                            />
                          </td>

                          {/* Delete Button */}
                          <td className="py-2.5 px-3 text-center align-top">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleDeleteRecord(rec)}
                              className="h-8 w-8 rounded-full border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer mx-auto shadow-xs active:scale-95 disabled:opacity-50"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>

                          {/* Save Button */}
                          <td className="py-2.5 px-3 text-center align-top">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleSaveRecord(rec)}
                              className="h-8 w-8 rounded-full border border-[#E7E0D2] bg-white hover:bg-[#E8C16D]/20 hover:border-[#E8C16D] text-[#B88728] dark:text-[#E8C16D] dark:border-white/[0.08] dark:bg-[#080B11] flex items-center justify-center transition-colors cursor-pointer mx-auto shadow-xs active:scale-95 disabled:opacity-50"
                              title="Save Record"
                            >
                              {isSaving ? (
                                <Loader2 size={13} className="animate-spin text-[#B88728] dark:text-[#E8C16D]" />
                              ) : (
                                <Save size={13} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
