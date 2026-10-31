import { Suspense } from "react";
import EditProduct from "@/components/Dashboard/Products/ManageProducts/EditProduct";

export default function EditProductProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-500">Loading profile...</div>}>
      <EditProduct returnPath="/dashboard/settings/manage-product/product-profile" />
    </Suspense>
  );
}

