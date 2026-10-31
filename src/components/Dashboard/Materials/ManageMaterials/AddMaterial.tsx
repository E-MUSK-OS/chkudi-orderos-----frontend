"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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
      <div className="space-y-4 sm:space-y-6 w-full pb-28 sm:pb-36">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-700 hover:text-[#0A0E1A] dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] transition-colors cursor-pointer border border-slate-200/60 dark:border-white/[0.08]"
              title="Back to Material Profile"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg sm:text-2xl font-black text-[#0A0E1A] dark:text-white tracking-tight mt-0.5">
                {pageTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pageSubtitle}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              disabled={loading}
              className="min-h-[42px] h-10 px-5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="material-form"
              disabled={loading || (isEdit && isFetchingMaterial)}
              className="min-h-[42px] h-10 px-6 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              disabled={loading}
              className="min-h-[42px] h-11 px-6 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="material-form"
              disabled={loading || (isEdit && isFetchingMaterial)}
              className="min-h-[42px] h-11 px-7 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
