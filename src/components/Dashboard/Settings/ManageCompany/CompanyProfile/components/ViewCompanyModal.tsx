"use client";

import React from "react";
import {
  X,
  Building2,
  User,
  FileText,
  Mail,
  Phone,
  MapPin,
  Landmark,
  Edit3,
  Calendar,
} from "lucide-react";
import { Company } from "../types/company.types";
import { getMediaUrl } from "@/lib/utils";

interface ViewCompanyModalProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onEditClick: (company: Company) => void;
}

export default function ViewCompanyModal({
  open,
  company,
  onClose,
  onEditClick,
}: ViewCompanyModalProps) {
  if (!open || !company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white border border-[#E7E0D2] dark:bg-[#13161F] dark:border-white/[0.1] rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 dark:bg-black dark:border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0">
              {company.logoUrl ? (
                <img
                  src={getMediaUrl(company.logoUrl)}
                  alt={company.companyName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 size={24} className="text-[#B88728] dark:text-[#F5C451]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                  {company.companyName || "Untitled Company"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    company.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                      : company.status === "DRAFT"
                      ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                      : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      company.status === "ACTIVE"
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : company.status === "DRAFT"
                        ? "bg-amber-500 dark:bg-amber-400"
                        : "bg-slate-400"
                    }`}
                  />
                  {company.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Company Code: <span className="font-semibold text-slate-800 dark:text-slate-200">{company.companyCode || "—"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-sm text-[#0A0E1A] dark:text-slate-200">
          {/* Key Identifiers */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-xl p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User size={13} className="text-slate-400 dark:text-slate-400" />
                Owner Name
              </p>
              <p className="text-sm font-semibold text-[#0A0E1A] dark:text-slate-200 uppercase mt-1">
                {company.ownerName || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400 dark:text-slate-400" />
                GST Number
              </p>
              <p className="text-sm font-mono font-semibold text-[#0A0E1A] dark:text-slate-200 mt-1 tracking-wider">
                {company.gstNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400 dark:text-slate-400" />
                PAN Number
              </p>
              <p className="text-sm font-mono font-semibold text-[#0A0E1A] dark:text-slate-200 mt-1 tracking-wider">
                {company.panNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400 dark:text-slate-400" />
                State & Code
              </p>
              <p className="text-sm font-semibold text-[#0A0E1A] dark:text-slate-200 mt-1">
                {company.state || "Gujarat"} ({company.stateCode || "24"})
              </p>
            </div>
          </div>

          {/* Contact Details */}
          {(company.email || company.phone) && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#F5C451]">
                Contact Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-xl p-3.5">
                {company.email && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone size={14} className="text-slate-400" />
                    <span>{company.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Registered Address */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#F5C451]">
              Registered Address
            </p>
            <div className="bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-xl p-3.5 text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                {company.addressLine1 && <p>{company.addressLine1}</p>}
                {company.addressLine2 && <p>{company.addressLine2}</p>}
                <p>
                  {[company.city, company.state, company.pincode]
                    .filter(Boolean)
                    .join(", ") || "No address details specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Info */}
          {(company.bankName || company.accountNumber) && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#F5C451]">
                Banking Information
              </p>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-xl p-3.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Bank Name:</span>
                  <p className="text-[#0A0E1A] dark:text-slate-200 font-semibold mt-0.5">
                    {company.bankName || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Account Number:</span>
                  <p className="text-[#0A0E1A] dark:text-slate-200 font-mono font-semibold mt-0.5">
                    {company.accountNumber || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">IFSC Code:</span>
                  <p className="text-[#0A0E1A] dark:text-slate-200 font-mono font-semibold mt-0.5">
                    {company.ifscCode || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Branch:</span>
                  <p className="text-[#0A0E1A] dark:text-slate-200 font-semibold mt-0.5">
                    {company.branchName || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Audit Timestamp */}
          <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              Created: {new Date(company.createdAt).toLocaleDateString()}
            </span>
            <span>
              Updated: {new Date(company.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E7E0D2] dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.1] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEditClick(company);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0A0E1A] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow transition-all cursor-pointer active:scale-95"
          >
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
