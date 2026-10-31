"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import ProductForm from "./components/ProductForm";
import { usePagePermissions } from "@/utils/pagePermissions";

interface Props {
  returnPath?: string;
}

export default function AddProduct({
  returnPath = "/dashboard/settings/manage-product/product-profile",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSuccess = () => {
    setLoading(false);
    router.push(returnPath);
  };

  const { canCreate } = usePagePermissions("settings/manage-product");

  if (!canCreate) {
    return (
      <DashboardLayout title="Add Product">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Access Denied</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You do not have permission to create products.
          </p>
          <button
            type="button"
            onClick={() => router.push(returnPath)}
            className="h-10 px-5 rounded-2xl text-xs font-bold bg-[#E8C16D] text-[#0A0E1A]"
          >
            Back to Product Profile
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Add Product">
      <div className="space-y-4 sm:space-y-6 w-full pb-10">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-700 hover:text-[#0A0E1A] dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] transition-colors cursor-pointer border border-slate-200/60 dark:border-white/[0.08]"
              title="Back to Product Profile"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg sm:text-2xl font-black text-[#0A0E1A] dark:text-white tracking-tight mt-0.5">
                Add New Product
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Create a new product with custom attributes, sizes, colors, and Kardex inventory specifications.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end sm:justify-start">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              disabled={loading}
              className="flex-1 sm:flex-none min-h-[42px] h-10 px-5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="flex-1 sm:flex-none min-h-[42px] h-10 px-6 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Save Product</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Form Body Container */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <ProductForm
            mode="create"
            onSuccess={handleSuccess}
            onLoadingChange={setLoading}
          />

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              disabled={loading}
              className="w-full sm:w-auto min-h-[42px] h-11 px-6 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="w-full sm:w-auto min-h-[42px] h-11 px-7 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Save Product</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

