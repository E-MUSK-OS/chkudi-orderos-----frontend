"use client";

import React, { useRef } from "react";
import { X, Printer, User, Building, Phone, Calendar, HeartPulse, CreditCard } from "lucide-react";
import { Employee } from "../types/employee.types";
import { getMediaUrl } from "@/lib/utils";

interface PrintIdCardModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

export default function PrintIdCardModal({
  employee,
  isOpen,
  onClose,
  companyName = "JAY BHAVANI FASHION",
}: PrintIdCardModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (val?: string | null) => {
    if (!val) return "-";
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Container */}
      <div className="bg-[#101623] border border-[#1f293d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white" />
            <h3 className="text-base font-semibold text-white">Employee ID Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#182133] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#0b0f19]">
          <div
            ref={printRef}
            id="printable-id-card"
            className="w-72 bg-[#141b2a] border border-white/[0.12] rounded-2xl p-5 shadow-2xl text-center text-white relative overflow-hidden"
          >
            {/* Top Accent Ribbon (Clean subtle white/slate) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

            {/* Company Name */}
            <div className="mt-1 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                {employee.branch || companyName}
              </h2>
              <p className="text-[10px] text-gray-400 tracking-wide uppercase">Identity Card</p>
            </div>

            {/* Employee Photo */}
            <div className="relative mx-auto mb-3 w-24 h-24 rounded-xl border border-white/[0.15] overflow-hidden bg-[#182133] flex items-center justify-center shadow-inner">
              {employee.photoUrl ? (
                <img
                  src={getMediaUrl(employee.photoUrl)}
                  alt={employee.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Employee Full Name */}
            <h3 className="text-base font-bold text-white tracking-tight">
              {employee.fullName}
            </h3>

            {/* Employee ID Badge (Clean white badge) */}
            <div className="inline-block px-3 py-0.5 mt-1 mb-3 rounded-full bg-white/[0.08] border border-white/[0.15] text-white text-xs font-semibold">
              ID: {employee.employeeId}
            </div>

            {/* Details Grid */}
            <div className="text-left space-y-1.5 text-xs border-t border-[#1f293d] pt-3">
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" /> Department:
                </span>
                <span className="font-medium text-gray-200">{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" /> Designation:
                </span>
                <span className="font-medium text-gray-200">{employee.designation}</span>
              </div>
              {employee.contactNo && (
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Contact:
                  </span>
                  <span className="font-medium text-gray-200">{employee.contactNo}</span>
                </div>
              )}
              {employee.bloodGroup && (
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-red-400" /> Blood Group:
                  </span>
                  <span className="font-semibold text-red-400">{employee.bloodGroup}</span>
                </div>
              )}
              {employee.joiningDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Joining:
                  </span>
                  <span className="font-medium text-gray-200">{formatDate(employee.joiningDate)}</span>
                </div>
              )}
            </div>

            {/* Mock Barcode / ID Strip */}
            <div className="mt-4 pt-3 border-t border-[#1f293d] flex flex-col items-center">
              <div className="h-6 w-44 flex items-center justify-center gap-1">
                {[4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 2, 6, 3, 5, 2, 7].map((w, idx) => (
                  <div
                    key={idx}
                    className="h-5 bg-gray-300"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">
                {employee.employeeId}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f293d] bg-[#101623]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#F5C451] hover:bg-[#e8b83e] active:scale-[0.98] text-slate-900 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print ID Card</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-id-card,
          #printable-id-card * {
            visibility: visible;
          }
          #printable-id-card {
            position: absolute;
            left: 50%;
            top: 20%;
            transform: translateX(-50%);
            width: 320px !important;
            border: 2px solid #333 !important;
            box-shadow: none !important;
            color: #000 !important;
            background: #fff !important;
          }
          #printable-id-card * {
            color: #111 !important;
          }
        }
      `}</style>
    </div>
  );
}

