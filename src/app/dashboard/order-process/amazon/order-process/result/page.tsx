"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ComparisonResultView from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/components/ComparisonResultView";
import { useAmazonOrderStore } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/store/useAmazonOrderStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AmazonOrderResultPage() {
  const router = useRouter();
  const { summary, restoreProcessData, clearProcessData } = useAmazonOrderStore();
  const [isRestoring, setIsRestoring] = useState(!summary);

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
    };
  }, [summary, restoreProcessData, router]);

  const handleReset = () => {
    clearProcessData();
    router.push("/dashboard/order-process/amazon/order-process");
  };

  if (isRestoring || !summary) {
    return (
      <DashboardLayout title="Amazon Order Verification Results">
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#E8C16D]" />
          <p className="text-sm font-medium text-slate-500">
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


