import { Suspense } from "react";
import EditProductVariant from "@/components/Dashboard/Products/ManageProducts/EditProductVariant";

export default function EditProductVariantDirectPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-500">
          Loading variant...
        </div>
      }
    >
      <EditProductVariant returnPath="/dashboard/settings/manage-product/product-profile" />
    </Suspense>
  );
}
