"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Package } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import MaterialForm from "./components/MaterialForm";
import { useMaterial } from "./hooks/useMaterials";

interface Props {
  returnPath?: string;
  materialId?: string;
}

function AddMaterialContent({
  returnPath = "/dashboard/settings/manage-material/material-profile",
  materialId: propId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");
  const effectiveId = propId || queryId || undefined;
  const isEdit = Boolean(effectiveId);

  const [loading, setLoading] = useState(false);

  const { data: materialRes, isLoading: isFetchingMaterial } = useMaterial(
    effectiveId || ""
  );
  const material = materialRes?.data;

  const handleSuccess = () => {
    setLoading(false);
    router.push(returnPath);
  };

  const pageTitle = isEdit ? "Edit Material" : "Add New Material";
  const pageSubtitle = isEdit
    ? "Update material details, specifications, and Kardex inventory configuration."
    : "Create a new material with specifications, and Kardex inventory details.";

  return (
    <DashboardLayout title={pageTitle}>
      <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-28 sm:pb-36 max-w-[1600px] mx-auto">
        {/* Top Header Card matching Company Profile & Employee Profile */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to Material Profile"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                {pageTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pageSubtitle}
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
              form="material-form"
              disabled={loading || (isEdit && isFetchingMaterial)}
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
                  <span>{isEdit ? "Update Material" : "Save Material"}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Form Body Container */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          {isEdit && isFetchingMaterial ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#E8C16D]" />
              <p className="text-xs sm:text-sm font-medium">Loading material details...</p>
            </div>
          ) : (
            <MaterialForm
              mode={isEdit ? "edit" : "create"}
              material={material}
              onSuccess={handleSuccess}
              onLoadingChange={setLoading}
            />
          )}

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
              form="material-form"
              disabled={loading || (isEdit && isFetchingMaterial)}
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
                  <span>{isEdit ? "Update Material" : "Save Material"}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AddMaterial(props: Props) {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Material">
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#E8C16D]" />
          </div>
        </DashboardLayout>
      }
    >
      <AddMaterialContent {...props} />
    </Suspense>
  );
}
