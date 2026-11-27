import { Suspense } from "react";
import EditMaterialVariant from "@/components/Dashboard/Materials/ManageMaterials/EditMaterialVariant";

export default function EditMaterialVariantPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-500">
          Loading material variant...
        </div>
      }
    >
      <EditMaterialVariant returnPath="/dashboard/settings/manage-material/material-profile" />
    </Suspense>
  );
}
