"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BarcodeDesign } from "@/components/Dashboard/Labels/Designer/BarcodeDesign";
import { TemplateGallery } from "@/components/Dashboard/Labels/Designer/TemplateGallery";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

function DesignerContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (id) {
    return <BarcodeDesign />;
  }

  return (
    <DashboardLayout title="Label Templates">
      <TemplateGallery />
    </DashboardLayout>
  );
}

export default function DesignerPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#E8C16D]" size={32} /></div>}>
      <DesignerContent />
    </Suspense>
  );
}
