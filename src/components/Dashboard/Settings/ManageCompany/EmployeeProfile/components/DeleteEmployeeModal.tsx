"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Employee } from "../types/employee.types";

interface DeleteEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export default function DeleteEmployeeModal({
  employee,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteEmployeeModalProps) {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E7E0D2] dark:bg-[#101623] dark:border-[#1f293d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1f293d]">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Delete Employee</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#182133] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Are you sure you want to delete employee{" "}
            <span className="font-semibold text-white">"{employee.fullName}"</span> (
            <span className="text-amber-400">{employee.employeeId}</span>)?
          </p>
          <p className="text-xs text-gray-400 mt-2">
            This action cannot be undone. All related profile records will be permanently removed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-[#1f293d] bg-[#0c101a]">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[#182133] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

