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
  Loader2,
} from "lucide-react";
import { Employee } from "./types/employee.types";
import { employeeService } from "./services/employee.service";
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

  if (isLoading) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-white mb-3" />
          <p className="text-sm font-medium">Loading employee details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg || !employee) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-[#0E121A] rounded-2xl border border-white/[0.08] w-full">
          <p className="text-sm text-rose-400 mb-4">{errorMsg || "Employee not found."}</p>
          <button
            onClick={() =>
              router.push("/dashboard/setting/manage-company/employee-profile")
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Employee List</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employee Profile">
      <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-8 space-y-4">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push("/dashboard/setting/manage-company/employee-profile")
              }
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
              title="Back to Employee Profile"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Employee Profile
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/setting/manage-company/employee-profile/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#F5C451] hover:bg-[#E8B83D] active:scale-[0.98] text-[#0A0E1A] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#F5C451]/10 cursor-pointer"
            >
              Create User
            </Link>
            <Link
              href={`/dashboard/setting/manage-company/employee-profile/edit/${employee.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-[#E7E0D2] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 dark:border-white/[0.1] font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        {/* Main Profile View Card matching Ledger Book & Reference Image 5 */}
        <div className="w-full rounded-2xl border border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-md dark:border-white/[0.08] dark:bg-[#0E121A] dark:text-slate-100 dark:shadow-2xl overflow-hidden font-sans p-6 sm:p-8 space-y-8">
          {/* Top Header Section: Avatar Box on Left, General Details on Right */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Avatar & Identification Box */}
            <div className="flex flex-col items-center flex-shrink-0 w-full sm:w-44">
              <div className="w-36 h-36 rounded-2xl bg-slate-100 border border-slate-200 dark:bg-[#131622] dark:border-white/[0.1] overflow-hidden flex items-center justify-center shadow-lg relative mb-3">
                {employee.photoUrl ? (
                  <img
                    src={getMediaUrl(employee.photoUrl)}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-slate-500 stroke-1" />
                )}
              </div>

              {/* Active / Inactive Badge */}
              <div className="mb-2">
                {employee.isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 dark:text-slate-400 dark:bg-white/[0.04] dark:border-white/[0.08]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Employee ID Badge */}
              <span className="text-xs font-mono font-semibold text-cyan-900 bg-cyan-50 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-800/40 px-3 py-1 rounded-lg">
                Employee ID: {employee.employeeId}
              </span>
            </div>

            {/* General Details Right Section */}
            <div className="flex-1 w-full space-y-5">
              <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                <SlidersHorizontal size={17} className="text-slate-500 dark:text-slate-300" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  General Details
                </h2>
              </div>

              {/* Name + Subtitle */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {employee.fullName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Building size={14} className="text-slate-400 dark:text-slate-500" />
                  {employee.company && <span>{employee.company}</span>}
                  {employee.company && employee.branch && <span>•</span>}
                  <span>{employee.branch || "Head Office"}</span>
                  <span>•</span>
                  <span>{employee.department}</span>
                </div>
              </div>

              {/* 4-Column Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-xs pt-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Date Of Birth.</span>
                  <span className="text-slate-900 dark:text-slate-100 font-medium font-mono">
                    {formatDate(employee.dob)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Aadhar No.</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono font-medium">
                    {employee.aadhaarNo || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Contact No.</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono font-medium flex items-center gap-1">
                    <Phone size={12} className="text-emerald-500 dark:text-emerald-400" />
                    {employee.contactNo}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Blood Group</span>
                  <span className="text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
                    <HeartPulse size={12} className="text-red-500 dark:text-red-400" />
                    {employee.bloodGroup || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Login Id.</span>
                  <span className="text-slate-900 dark:text-slate-200 break-all font-mono font-medium">
                    {employee.loginId || employee.email || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Machine Code.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">
                    {employee.machineCode || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Designation.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {employee.designation}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Joining Date.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium font-mono">
                    {formatDate(employee.joiningDate)}
                  </span>
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

              {/* Identity Document Preview Box (shows all uploaded documents in a row) */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">
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
                          className="inline-flex items-center gap-2.5 p-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-[#131622] dark:hover:bg-[#1a1f2e] dark:border-white/[0.08] transition-all text-xs text-slate-800 hover:text-slate-900 dark:text-white font-medium group shadow-2xs"
                          title={doc.name}
                        >
                          {doc.url && !isPdf ? (
                            <img
                              src={getMediaUrl(doc.url)}
                              alt={doc.name}
                              className="w-5 h-5 rounded object-cover border border-slate-200 dark:border-white/10"
                            />
                          ) : (
                            <FileText size={16} className="text-slate-500 dark:text-slate-300" />
                          )}
                          <span>View {doc.name || "Attached Document"}</span>
                        </a>
                      );
                    })
                  ) : employee.identityDocUrl ? (
                    <div className="inline-block p-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#131622] dark:border-white/[0.08] min-w-[220px]">
                      <a
                        href={getMediaUrl(employee.identityDocUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-slate-800 hover:text-slate-900 dark:text-white dark:hover:text-slate-300 transition-colors font-medium"
                      >
                        <FileText size={16} className="text-slate-500 dark:text-slate-300" />
                        <span>View Attached Identity Document</span>
                      </a>
                    </div>
                  ) : (
                    <div className="inline-block p-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#131622] dark:border-white/[0.08] min-w-[220px]">
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <FileText size={16} className="text-slate-400 dark:text-slate-500" />
                        <span>No document</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Contact Details & Bank Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#E7E0D2] dark:border-white/[0.06]">
            {/* Contact Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-3">
                <MapPin size={17} className="text-slate-500 dark:text-slate-300" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Contact Details
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Address.</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {[
                      employee.addressLine1,
                      employee.addressLine2,
                      employee.city,
                      employee.state,
                      employee.country,
                      employee.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>

                {employee.contactNo && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono">
                    <Phone size={14} className="text-slate-400" />
                    <span>{employee.contactNo}</span>
                  </div>
                )}

                {employee.email && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono">
                    <Mail size={14} className="text-slate-400" />
                    <span>{employee.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-3">
                <CreditCard size={17} className="text-slate-500 dark:text-slate-300" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Bank Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Account No.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">
                    {employee.accountNumber || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Holder Name.</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {employee.accountHolderName || employee.fullName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Bank Name.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {employee.bankName || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Branch Name.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {employee.branchName || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Account Type.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {employee.accountType || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">IFSC Code.</span>
                  <span className="text-slate-900 dark:text-slate-200 font-mono font-medium uppercase">
                    {employee.ifscCode || "-"}
                  </span>
                </div>
              </div>

              {/* Bank Document Box */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">
                  Bank Document.
                </span>
                <div className="inline-block p-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#131622] dark:border-white/[0.08] min-w-[220px]">
                  {employee.bankDocUrl ? (
                    <a
                      href={getMediaUrl(employee.bankDocUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-slate-800 hover:text-slate-900 dark:text-white dark:hover:text-slate-300 transition-colors font-medium"
                    >
                      <FileText size={16} className="text-slate-500 dark:text-slate-300" />
                      <span>View Attached Bank Document</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <FileText size={16} className="text-slate-400 dark:text-slate-500" />
                      <span>No document</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Audit Metadata Strip */}
          <div className="pt-6 border-t border-[#E7E0D2] dark:border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Creation Date</span>
              <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">
                {formatDate(employee.createdAt)}
              </span>
            </div>

            <div>
              <span className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Created By</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium truncate block">
                {employee.createdByName || "-"}
              </span>
            </div>

            <div>
              <span className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Last Updated</span>
              <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">
                {formatDate(employee.updatedAt)}
              </span>
            </div>

            <div>
              <span className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Last Updated By</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium truncate block">
                {employee.updatedByName || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
