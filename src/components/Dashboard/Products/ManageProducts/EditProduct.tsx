"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Trash2, AlertCircle } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import ProductForm from "./components/ProductForm";
import DeleteProductModal from "./components/DeleteProductModal";
import { useProduct, useDeleteProduct } from "./hooks/useProducts";
import { toast } from "sonner";
import { usePagePermissions } from "@/utils/pagePermissions";

interface Props {
  productId?: string;
  returnPath?: string;
}

export default function EditProduct({
  productId: propProductId,
  returnPath = "/dashboard/settings/manage-product/product-profile",
}: Props) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Resolve product ID from prop, params, or search query
  const rawId =
    propProductId ||
    (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)) ||
    searchParams.get("id") ||
    "";

  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: productResponse, isLoading, error, refetch } = useProduct(rawId);
  const product = productResponse?.data;
  const deleteProductMutation = useDeleteProduct();

  const handleSuccess = () => {
    setLoading(false);
    toast.success("Product profile updated successfully");
    router.push(returnPath);
  };

  const handleDeleteConfirm = async () => {
    if (!product?.id) return;
    setDeleteLoading(true);
    try {
      await deleteProductMutation.mutateAsync(product.id);
      setDeleteModalOpen(false);
      router.push(returnPath);
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      toast.error(err?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const { canUpdate, canDelete } = usePagePermissions("settings/manage-product");

  if (!canUpdate) {
    return (
      <DashboardLayout title="Edit Product Profile">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Access Denied</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You do not have permission to edit products.
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
    <DashboardLayout title="Edit Product Profile">
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
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-[#0A0E1A] dark:text-white tracking-tight mt-0.5">
                  Edit Product Profile
                </h1>
                {product?.productName && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                    {product.productName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update product details, custom attributes, sizes, colors, and Kardex inventory specifications.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end sm:justify-start">
            <button
              type="submit"
              form="product-form"
              disabled={loading || isLoading || !product}
              className="w-full sm:w-auto min-h-[42px] h-10 px-6 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Update Product</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Form Body or Loading Skeleton or Error */}
        {isLoading ? (
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-8 animate-pulse space-y-6">
            <div className="h-7 w-52 bg-slate-200 dark:bg-white/[0.06] rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
            </div>
            <div className="h-64 bg-slate-100 dark:bg-white/[0.04] rounded-3xl" />
          </div>
        ) : error || !product ? (
          <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 p-8 text-center space-y-3">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">
              Product Not Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {(error as any)?.message || "The requested product profile could not be loaded or may have been deleted."}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => refetch()}
                className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => router.push(returnPath)}
                className="h-10 px-5 rounded-xl text-xs font-bold bg-[#0A0E1A] text-[#E8C16D] hover:bg-slate-900 dark:bg-[#F5C451] dark:text-black cursor-pointer"
              >
                Back to Product Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
            <ProductForm
              key={`edit-${product.id}`}
              mode="edit"
              product={product}
              onSuccess={handleSuccess}
              onLoadingChange={setLoading}
            />

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={loading || deleteLoading}
                  className="w-full sm:w-auto min-h-[42px] h-11 px-5 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={16} />
                  <span>Delete Product</span>
                </button>
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.push(returnPath)}
                  disabled={loading || deleteLoading}
                  className="flex-1 sm:flex-none min-h-[42px] h-11 px-6 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] text-center"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="product-form"
                  disabled={loading || deleteLoading}
                  className="flex-1 sm:flex-none min-h-[42px] h-11 px-7 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Update Product</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteProductModal
        open={deleteModalOpen}
        product={product ?? null}
        loading={deleteLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}

