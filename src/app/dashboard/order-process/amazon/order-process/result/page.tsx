"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ComparisonResultView from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/components/ComparisonResultView";
import { useAmazonOrderStore } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/store/useAmazonOrderStore";
import { clearCachedAmazonDocs } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/utils/pdfCache";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AmazonOrderResultPage() {
  const router = useRouter();
  const { summary, restoreProcessData, clearProcessData, setProcessing } = useAmazonOrderStore();
  const [isRestoring, setIsRestoring] = useState(!summary);

  useEffect(() => {
    // Reset processing state on result page mount
    setProcessing(false);
  }, [setProcessing]);

  useEffect(() => {
    let isMounted = true;
    if (!summary) {
      setIsRestoring(true);
      restoreProcessData().then((restored) => {
        if (!isMounted) return;
        setIsRestoring(false);
        if (!restored) {
          router.push("/dashboard/order-process/amazon/order-process");
        }
      });
    } else {
      setIsRestoring(false);
    }
    return () => {
      isMounted = false;
      clearCachedAmazonDocs();
    };
  }, [summary, restoreProcessData, router]);

  const handleReset = () => {
    clearProcessData();
    router.push("/dashboard/order-process/amazon/order-process");
  };

  if (isRestoring || !summary) {
    return (
      <DashboardLayout title="Amazon Order Verification Results">
        <div className="flex h-64 sm:h-96 flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#B88728]" />
          <p className="text-sm font-semibold text-slate-600">
            Loading batch verification data...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Amazon Order Verification Results">
      <div className="space-y-6">
        <ComparisonResultView
          isStandaloneTab={true}
          onReset={handleReset}
        />
      </div>
    </DashboardLayout>
  );
}


