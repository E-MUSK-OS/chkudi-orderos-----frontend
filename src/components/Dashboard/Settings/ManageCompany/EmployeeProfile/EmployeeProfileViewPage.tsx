"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import {
  ArrowLeft,
  Edit2,
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  HeartPulse,
  SlidersHorizontal,
  Landmark,
  Printer,
  Users,
  Loader2,
} from "lucide-react";
import { Employee } from "./types/employee.types";
import { employeeService } from "./services/employee.service";
import PrintIdCardModal from "./components/PrintIdCardModal";
import { getMediaUrl } from "@/lib/utils";

interface EmployeeProfileViewPageProps {
  id: string;
}

export default function EmployeeProfileViewPage({
  id,
}: EmployeeProfileViewPageProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    async function loadEmployee() {
      try {
        setIsLoading(true);
        const res = await employeeService.getEmployeeById(id);
        setEmployee(res.data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load employee details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployee();
  }, [id]);

  const formatDate = (val?: string | null) => {
    if (!val) return "—";
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

  if (isLoading) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#F5C451] mb-3" />
          <p className="text-sm font-medium">Loading employee details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg || !employee) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-[#EAE4D8] shadow-sm dark:bg-[#0E121A] rounded-2xl dark:border-white/[0.08] w-full">
          <p className="text-sm text-rose-500 dark:text-rose-400 mb-4">{errorMsg || "Employee not found."}</p>
          <button
            onClick={() =>
              router.push("/dashboard/setting/manage-company/employee-profile")
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0E1A] text-white font-semibold text-xs rounded-xl hover:bg-black dark:bg-white dark:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Employee List</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const creationDateFormatted = formatDate(employee.createdAt);
  const lastUpdatedFormatted = formatDate(employee.updatedAt || employee.createdAt);
  const createdBy = employee.createdByName || "—";
  const updatedBy = employee.updatedByName || employee.createdByName || "—";

  return (
    <DashboardLayout title="Employee Profile">
      <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-8 space-y-4 max-w-[1600px] mx-auto">
        {/* ========================================================================= */}
        {/* Top Header Bar matching Ledger Book / Company Profile header UI            */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/setting/manage-company/employee-profile")
                  }
                  className="w-10 h-10 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Back to Employee Profile"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                  Employee Profile
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
                Comprehensive view of employee personal details, addresses, banking, and company documents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Create User pill */}
              <Link
                href="/dashboard/settings/manage-users/user-profile/create-user"
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-1.5 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#0A0E1A] text-[#E8C16D] border border-[#0A0E1A] dark:bg-[#080B11] dark:border-white/[0.15] hover:bg-[#E8C16D] hover:text-[#0A0E1A] shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>Create User</span>
              </Link>

              {/* Edit Button pill */}
              <Link
                href={`/dashboard/setting/manage-company/employee-profile/edit/${employee.id}`}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-1.5 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] shadow-sm transition-all cursor-pointer"
              >
                <Edit2 size={15} />
                <span>Edit</span>
              </Link>

              {/* Print ID Card Button pill */}
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-1.5 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold bg-white dark:bg-[#080B11] text-slate-800 dark:text-white border border-[#E7E0D2] dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.04] shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Printer size={15} />
                <span>Print ID Card</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Full-Width Unified Profile Card matching Ledger Book & img-1 / img-2      */}
        {/* ========================================================================= */}
        <div className="w-full rounded-[24px] border border-[#EAE4D8] bg-white text-slate-900 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-100 overflow-hidden">
          {/* ========================================================================= */}
          {/* TOP SECTION: AVATAR (LEFT) + GENERAL DETAILS (RIGHT) WITH VERTICAL DIVIDER */}
          {/* ========================================================================= */}
          <div className="flex flex-col lg:flex-row items-stretch">
            {/* Left Avatar Box & Active Status Badge with Right Vertical Divider */}
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center shrink-0 border-b lg:border-b-0 lg:border-r border-[#EAE4D8] dark:border-white/[0.08] min-w-[200px] sm:min-w-[220px]">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border border-[#EAE4D8] dark:bg-[#080B11] dark:border-white/[0.1] overflow-hidden flex items-center justify-center p-1.5 shadow-xs">
                {employee.photoUrl ? (
                  <img
                    src={getMediaUrl(employee.photoUrl)}
                    alt={employee.fullName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <User size={56} className="text-slate-400 stroke-1" />
                )}
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EAFBF3] text-emerald-600 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 shadow-xs mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{employee.isActive ? "Active" : "Inactive"}</span>
              </div>

              {/* Employee ID Badge */}
              <span className="mt-2 text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 px-3 py-0.5 rounded-full">
                ID: {employee.employeeId}
              </span>
            </div>

            {/* Right: General Details Section */}
            <div className="flex-1 p-6 sm:p-8 min-w-0">
              {/* Header with badge + Title + horizontal divider line matching img-1 */}
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EAE4D8] dark:border-white/[0.08]">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={14} />
                </div>
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  General Details
                </h2>
              </div>

              {/* Name & Branch / Department Subtitle */}
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {employee.fullName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Building size={14} className="text-[#B88728] dark:text-[#E8C16D] shrink-0" />
                  {employee.company && <span className="font-semibold text-slate-700 dark:text-slate-300">{employee.company}</span>}
                  {employee.company && employee.branch && <span>•</span>}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {employee.branch || "Head Office"}
                  </span>
                  <span>•</span>
                  <span>{employee.department}</span>
                </div>
              </div>

              {/* 4-column layout matching Ledger Book / img-1 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Date Of Birth.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {formatDate(employee.dob)}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Aadhar No.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {employee.aadhaarNo || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Contact No.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5 font-mono flex items-center gap-1.5">
                    <Phone size={12} className="text-[#C28E2A] dark:text-[#E8C16D]" />
                    <span>{employee.contactNo}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Blood Group
                  </span>
                  <p className="text-[14px] font-bold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                    <HeartPulse size={13} className="text-rose-500" />
                    <span>{employee.bloodGroup || "—"}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Login Id.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5 font-mono break-all">
                    {employee.loginId || employee.email || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Machine Code.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {employee.machineCode || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Designation.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5">
                    {employee.designation}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Joining Date.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {formatDate(employee.joiningDate)}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Salary Type.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {employee.salaryType || "Salaried"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Basic Salary.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium font-mono">
                    {employee.basicSalary ? `₹ ${Number(employee.basicSalary).toLocaleString("en-IN")}` : "₹ 0"}
                  </span>
                </div>
              </div>

              {/* Identity Document Attachments */}
              <div className="pt-4 mt-4 border-t border-[#EAE4D8] dark:border-white/[0.08]">
                <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block mb-2">
                  Identity Document.
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {Array.isArray(employee.documents) && employee.documents.length > 0 ? (
                    employee.documents.map((doc, idx) => {
                      const isPdf =
                        doc.url?.toLowerCase().endsWith(".pdf") ||
                        doc.fileName?.toLowerCase().endsWith(".pdf");
                      return (
                        <a
                          key={doc.id || idx}
                          href={getMediaUrl(doc.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-[#EAE4D8] dark:bg-[#080B11] dark:hover:bg-white/[0.04] dark:border-white/[0.1] transition-all text-xs text-slate-800 hover:text-slate-900 dark:text-white font-medium shadow-xs"
                          title={doc.name}
                        >
                          {doc.url && !isPdf ? (
                            <img
                              src={getMediaUrl(doc.url)}
                              alt={doc.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-white/10"
                            />
                          ) : (
                            <FileText size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                          )}
                          <span>View {doc.name || "Attached Document"}</span>
                        </a>
                      );
                    })
                  ) : employee.identityDocUrl ? (
                    <a
                      href={getMediaUrl(employee.identityDocUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-[#EAE4D8] dark:bg-[#080B11] dark:hover:bg-white/[0.04] dark:border-white/[0.1] text-xs text-slate-800 hover:text-slate-900 dark:text-white font-medium shadow-xs"
                    >
                      <FileText size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                      <span>View Attached Identity Document</span>
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] text-xs text-slate-400">
                      <FileText size={14} className="text-slate-400" />
                      <span>No document attached</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE SECTION: 2 COLUMNS (WITH CLEAN VERTICAL DIVIDERS)                  */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 border-t border-[#EAE4D8] dark:border-white/[0.08] grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#EAE4D8] dark:divide-white/[0.08]">
            {/* Column 1: Contact Details */}
            <div className="space-y-4 pb-6 lg:pb-0 lg:pr-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <MapPin size={14} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Contact Details
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block mb-1">
                    Address.
                  </span>
                  <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {[
                      employee.addressLine1,
                      employee.addressLine2,
                      employee.city,
                      employee.state,
                      employee.country,
                      employee.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>

                {employee.contactNo && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 font-mono font-medium">
                    <Phone size={13} className="text-[#C28E2A] dark:text-[#E8C16D]" />
                    <span>{employee.contactNo}</span>
                  </div>
                )}

                {employee.email && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 font-mono font-medium">
                    <Mail size={13} className="text-[#C28E2A] dark:text-[#E8C16D]" />
                    <span>{employee.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Bank Details */}
            <div className="space-y-4 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <Landmark size={14} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Bank Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Account No.
                  </span>
                  <p className="text-[14px] font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {employee.accountNumber || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Holder Name.
                  </span>
                  <p className="text-[14px] font-bold uppercase text-slate-900 dark:text-white mt-0.5">
                    {employee.accountHolderName || employee.fullName}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Bank Name.
                  </span>
                  <p className="text-[14px] font-bold uppercase text-slate-900 dark:text-white mt-0.5">
                    {employee.bankName || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Branch Name.
                  </span>
                  <p className="text-[14px] font-bold uppercase text-slate-900 dark:text-white mt-0.5">
                    {employee.branchName || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    Account Type.
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5">
                    {employee.accountType || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block">
                    IFSC Code.
                  </span>
                  <p className="text-[14px] font-bold font-mono uppercase text-slate-900 dark:text-white mt-0.5">
                    {employee.ifscCode || "—"}
                  </p>
                </div>
              </div>

              {/* Bank Document Box */}
              <div className="pt-3 border-t border-[#EAE4D8] dark:border-white/[0.08]">
                <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal block mb-2">
                  Bank Document.
                </span>
                {employee.bankDocUrl ? (
                  <a
                    href={getMediaUrl(employee.bankDocUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-[#EAE4D8] dark:bg-[#080B11] dark:hover:bg-white/[0.04] dark:border-white/[0.1] text-xs text-slate-800 hover:text-slate-900 dark:text-white font-medium shadow-xs"
                  >
                    <FileText size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                    <span>View Attached Bank Document</span>
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] text-xs text-slate-400">
                    <FileText size={14} className="text-slate-400" />
                    <span>No document attached</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM METADATA FOOTER: GRADIENT COLOR MATCHING img-2                     */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gradient-to-r from-[#FFF6DE] via-[#FFF9EC] to-white dark:from-[#1E190F] dark:via-[#131722] dark:to-[#0A0E1A] border-t border-[#EAE4D8] dark:border-white/[0.08]">
            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Creation Date
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px]">
                {creationDateFormatted}
              </span>
            </div>

            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Created By
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px] truncate">
                {createdBy}
              </span>
            </div>

            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Last Updated
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px]">
                {lastUpdatedFormatted}
              </span>
            </div>

            <div>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal block mb-1">
                Last Updated By
              </span>
              <span className="font-bold text-slate-900 dark:text-white block text-[14px] sm:text-[15px] truncate">
                {updatedBy}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Print ID Card Modal */}
      <PrintIdCardModal
        employee={employee}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </DashboardLayout>
  );
}
