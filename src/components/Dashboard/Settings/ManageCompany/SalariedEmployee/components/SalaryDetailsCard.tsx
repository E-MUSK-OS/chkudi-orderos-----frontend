"use client";

import React, { useState, useEffect, useMemo } from "react";
import { User, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  SalariedEmployee,
  SalaryDetailsFormData,
} from "../types/salariedEmployee.types";
import { salariedEmployeeService } from "../services/salariedEmployee.service";
import { getMediaUrl } from "@/lib/utils";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";

const WORKING_DAY_MODE_OPTIONS: ThemeSelectOption[] = [
  { value: "Monthly", label: "Monthly" },
  { value: "Daily", label: "Daily" },
];

interface SalaryDetailsCardProps {
  employee: SalariedEmployee;
  onUpdateSuccess: (updated: SalariedEmployee) => void;
}

function formatDate(val?: string | null): string {
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

function getDaysInCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getCurrentMonthName(): string {
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return MONTH_NAMES[new Date().getMonth()];
}

function resolveInitialWorkingDays(
  empDays?: number | null,
  maxDays: number = getDaysInCurrentMonth()
): number {
  const num = Number(empDays);
  if (!num || isNaN(num) || num <= 0) return maxDays;
  if (num > maxDays) return maxDays;
  return num;
}

export default function SalaryDetailsCard({
  employee,
  onUpdateSuccess,
}: SalaryDetailsCardProps) {
  const daysInCurrentMonth = useMemo(() => getDaysInCurrentMonth(), []);
  const currentMonthName = useMemo(() => getCurrentMonthName(), []);

  const [formData, setFormData] = useState<SalaryDetailsFormData>(() => {
    const days = resolveInitialWorkingDays(employee.workingDays, daysInCurrentMonth);
    const hoursPerDay = Number(employee.workingHoursPerDay || 8);
    const totalHours = Number((days * hoursPerDay).toFixed(0));
    const basicSalary = Number(employee.basicSalary || 0);
    const wageRate = totalHours > 0 ? Number((basicSalary / totalHours).toFixed(2)) : 0;
    const otPercent = Number(employee.otRatePercent || 0);
    const otPerHour = otPercent > 0 ? Number(((wageRate * otPercent) / 100).toFixed(2)) : 0;

    return {
      basicSalary,
      workingDayMode: employee.workingDayMode || "Monthly",
      workingDays: days,
      workingHoursPerDay: hoursPerDay,
      totalHours,
      wageRate,
      otRatePercent: otPercent,
      otRatePerHour: otPerHour,
      transportAllowance: Number(employee.transportAllowance || 0),
      medicalAllowance: Number(employee.medicalAllowance || 0),
    };
  });

  const [saving, setSaving] = useState(false);

  // Sync state if employee prop updates
  useEffect(() => {
    const days = resolveInitialWorkingDays(employee.workingDays, daysInCurrentMonth);
    const hoursPerDay = Number(employee.workingHoursPerDay || 8);
    const totalHours = Number((days * hoursPerDay).toFixed(0));
    const basicSalary = Number(employee.basicSalary || 0);
    const wageRate = totalHours > 0 ? Number((basicSalary / totalHours).toFixed(2)) : 0;
    const otPercent = Number(employee.otRatePercent || 0);
    const otPerHour = otPercent > 0 ? Number(((wageRate * otPercent) / 100).toFixed(2)) : 0;

    setFormData({
      basicSalary,
      workingDayMode: employee.workingDayMode || "Monthly",
      workingDays: days,
      workingHoursPerDay: hoursPerDay,
      totalHours,
      wageRate,
      otRatePercent: otPercent,
      otRatePerHour: otPerHour,
      transportAllowance: Number(employee.transportAllowance || 0),
      medicalAllowance: Number(employee.medicalAllowance || 0),
    });
  }, [employee, daysInCurrentMonth]);

  // Dynamic automatic calculations
  const calculatedTotalHours = useMemo(() => {
    const days = Number(formData.workingDays) || 0;
    return Number((days * formData.workingHoursPerDay).toFixed(0));
  }, [formData.workingDays, formData.workingHoursPerDay]);

  const calculatedWageRate = useMemo(() => {
    if (calculatedTotalHours <= 0 || formData.basicSalary <= 0) return 0;
    return Number((formData.basicSalary / calculatedTotalHours).toFixed(2));
  }, [formData.basicSalary, calculatedTotalHours]);

  const calculatedOtRatePerHour = useMemo(() => {
    if (calculatedWageRate <= 0 || formData.otRatePercent <= 0) return 0;
    return Number(((calculatedWageRate * formData.otRatePercent) / 100).toFixed(2));
  }, [calculatedWageRate, formData.otRatePercent]);

  const handleChange = (field: keyof SalaryDetailsFormData, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleWorkingDayModeChange = (val: string) => {
    handleChange("workingDayMode", val);
    if (val === "Monthly") {
      const cur = Number(formData.workingDays);
      if (!cur || cur > daysInCurrentMonth) {
        handleChange("workingDays", daysInCurrentMonth);
      }
    }
  };

  const handleWorkingDaysChange = (valStr: string) => {
    if (valStr === "") {
      setFormData((prev) => ({ ...prev, workingDays: "" as any }));
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    if (val > daysInCurrentMonth) {
      toast.warning(`Working days cannot exceed ${daysInCurrentMonth} days for ${currentMonthName}.`);
      setFormData((prev) => ({ ...prev, workingDays: daysInCurrentMonth }));
      return;
    }
    if (val < 0) {
      setFormData((prev) => ({ ...prev, workingDays: 0 }));
      return;
    }
    setFormData((prev) => ({ ...prev, workingDays: val }));
  };

  const handleWorkingDaysBlur = () => {
    const currentVal = Number(formData.workingDays);
    if (!currentVal || currentVal < 1) {
      setFormData((prev) => ({ ...prev, workingDays: daysInCurrentMonth }));
    } else if (currentVal > daysInCurrentMonth) {
      setFormData((prev) => ({ ...prev, workingDays: daysInCurrentMonth }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalWorkingDays = Math.min(
      Math.max(1, Number(formData.workingDays) || daysInCurrentMonth),
      daysInCurrentMonth
    );

    if (Number(formData.workingDays) > daysInCurrentMonth) {
      toast.error(`Working days cannot exceed ${daysInCurrentMonth} days for ${currentMonthName}.`);
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<SalaryDetailsFormData> = {
        ...formData,
        workingDays: finalWorkingDays,
        totalHours: Number((finalWorkingDays * formData.workingHoursPerDay).toFixed(0)),
        wageRate: calculatedWageRate,
        otRatePerHour: calculatedOtRatePerHour,
      };

      const updated = await salariedEmployeeService.updateSalaryDetails(
        employee.id,
        payload
      );
      toast.success("Salary & working details saved successfully.");
      onUpdateSuccess(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update salary details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-sm flex flex-col font-sans">
      {/* Card Header Title */}
      <h2 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white mb-4 shrink-0">
        Basic Salary and Working Details
      </h2>

      {/* Profile Summary Box matching theme */}
      <div className="w-full rounded-2xl bg-[#FFFDF8] dark:bg-[#080B11] border border-[#EAE4D8] dark:border-white/[0.08] p-4 sm:p-5 mb-5 shadow-xs shrink-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-[#EAE4D8] dark:bg-[#161B24] dark:border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {employee.photoUrl ? (
              <img
                src={getMediaUrl(employee.photoUrl)}
                alt={employee.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={30} className="text-slate-400" />
            )}
          </div>

          {/* Employee Details Grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {/* Name */}
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Name</span>
              <span className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                {employee.fullName}
              </span>
            </div>

            {/* Contact */}
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Contact</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {employee.contactNo || "—"}
              </span>
            </div>

            {/* Joined */}
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Joined</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {formatDate(employee.joiningDate)}
              </span>
            </div>

            {/* Designation */}
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Designation</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {employee.designation || "—"}
              </span>
            </div>

            {/* Department */}
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Department</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {employee.department || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Sub-row */}
        <div className="mt-4 pt-3 border-t border-[#EAE4D8] dark:border-white/[0.06] grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Bank</span>
            <span className="text-slate-800 dark:text-slate-300 font-medium truncate block">
              {employee.bankName || "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Account No.</span>
            <span className="font-mono text-slate-800 dark:text-slate-300 truncate block">
              {employee.accountNumber || "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">IFSC Code.</span>
            <span className="font-mono text-slate-800 dark:text-slate-300 truncate block">
              {employee.ifscCode || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Salary & Working Details Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Row 1: Basic Salary, Working Day Mode, Working Days */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Basic Salary */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Basic Salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.basicSalary || ""}
                onChange={(e) =>
                  handleChange("basicSalary", parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 text-xs rounded-xl bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white outline-none transition-all shadow-xs font-mono"
              />
            </div>
          </div>

          {/* Working Day Mode */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Working Day Mode
            </label>
            <ThemeSelectDropdown
              ariaLabel="Working Day Mode"
              value={formData.workingDayMode || "Monthly"}
              onChange={(val) => handleWorkingDayModeChange(val)}
              options={WORKING_DAY_MODE_OPTIONS}
              className="w-full block"
              buttonClassName="w-full h-10 px-3 text-xs font-semibold rounded-xl justify-between border border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white dark:hover:border-[#E8C16D]"
              menuClassName="w-full min-w-full max-w-none"
            />
          </div>

          {/* Working Days */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Working Days
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Max: {daysInCurrentMonth}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={daysInCurrentMonth}
              value={formData.workingDays}
              onChange={(e) => handleWorkingDaysChange(e.target.value)}
              onBlur={handleWorkingDaysBlur}
              className="w-full h-10 px-3 text-xs text-right rounded-xl bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white outline-none transition-all shadow-xs font-mono"
            />
          </div>
        </div>

        {/* Row 2: Working Hour / Day, Total Hours, Wage Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Working Hour / Day */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Working Hour / Day
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.workingHoursPerDay}
              onChange={(e) =>
                handleChange(
                  "workingHoursPerDay",
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-full h-10 px-3 text-xs text-right rounded-xl bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white outline-none transition-all shadow-xs font-mono"
            />
          </div>

          {/* Total Hours (Calculated) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Total Hours
            </label>
            <div className="w-full h-10 px-3 flex items-center justify-end text-xs rounded-xl bg-slate-50 dark:bg-[#080B11]/50 border border-[#E7E0D2]/60 dark:border-white/[0.04] text-slate-800 dark:text-slate-200 font-mono select-none font-semibold">
              {calculatedTotalHours || 0}
            </div>
          </div>

          {/* Wage Rate (Calculated) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Wage Rate
            </label>
            <div className="w-full h-10 px-3 flex items-center justify-end text-xs rounded-xl bg-slate-50 dark:bg-[#080B11]/50 border border-[#E7E0D2]/60 dark:border-white/[0.04] text-slate-800 dark:text-slate-200 font-mono select-none font-semibold">
              {calculatedWageRate > 0 ? calculatedWageRate.toFixed(2) : "—"}
            </div>
          </div>
        </div>

        {/* Row 3: OT Rate %, OT Rate / Hour */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* OT Rate % */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              OT Rate %
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                %
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.otRatePercent || ""}
                onChange={(e) =>
                  handleChange("otRatePercent", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="w-full h-10 pl-7 pr-3 text-xs text-right rounded-xl bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white outline-none transition-all shadow-xs font-mono"
              />
            </div>
          </div>

          {/* OT Rate / Hour (Calculated) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              OT Rate / Hour
            </label>
            <div className="w-full h-10 px-3 flex items-center justify-end text-xs rounded-xl bg-slate-50 dark:bg-[#080B11]/50 border border-[#E7E0D2]/60 dark:border-white/[0.04] text-slate-800 dark:text-slate-200 font-mono select-none font-semibold">
              {calculatedOtRatePerHour > 0
                ? calculatedOtRatePerHour.toFixed(2)
                : "—"}
            </div>
          </div>
        </div>

        {/* Row 4: Transport Allowance / Month, Medical Allowance / Month */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Transport Allowance / Month */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Transport Allowance / Month
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.transportAllowance || ""}
                onChange={(e) =>
                  handleChange(
                    "transportAllowance",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 text-xs text-right rounded-xl bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white outline-none transition-all shadow-xs font-mono"
              />
            </div>
          </div>

          {/* Medical Allowance / Month */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Medical Allowance / Month
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.medicalAllowance || ""}
                onChange={(e) =>
                  handleChange(
                    "medicalAllowance",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 text-xs text-right rounded-xl bg-white border border-[#E7E0D2] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] placeholder-slate-400 dark:bg-[#080B11] dark:border-white/[0.08] dark:focus:border-[#E8C16D] dark:text-white outline-none transition-all shadow-xs font-mono"
              />
            </div>
          </div>
        </div>

        </div>

        {/* Submit Button */}
        <div className="pt-4 mt-auto">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.98] text-[#0A0E1A] font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin text-[#0A0E1A]" />
            ) : (
              <Check size={16} className="text-[#0A0E1A] stroke-[2.5]" />
            )}
            <span>{saving ? "Saving..." : "Submit"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
