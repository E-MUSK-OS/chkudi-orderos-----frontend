import { Suspense } from "react";
import ProductGalleryPage from "@/components/Dashboard/OfflineSales/ProductGallery/ProductGalleryPage";

export default function OfflineSalesProductGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-500">
          Loading Product Gallery...
        </div>
      }
    >
      <ProductGalleryPage />
    </Suspense>
  );
}
