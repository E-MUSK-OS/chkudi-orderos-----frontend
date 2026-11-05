"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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
      <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-28 sm:pb-36 max-w-[1600px] mx-auto">
        {/* Top Header Card matching Create / Edit Material */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to Product Profile"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Add New Product
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Create a new product with custom attributes, sizes, colors, and Kardex inventory specifications.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-end md:self-center">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center px-6 rounded-full text-xs sm:text-sm font-bold border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 px-6 rounded-full text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
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
          <div className="mt-8 pt-6 border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center px-6 rounded-full text-xs sm:text-sm font-bold border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 px-7 rounded-full text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
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

