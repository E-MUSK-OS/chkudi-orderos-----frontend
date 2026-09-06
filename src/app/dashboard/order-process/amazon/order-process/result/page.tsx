"use client";

import { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ComparisonResultView from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/components/ComparisonResultView";
import { useAmazonOrderStore } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/store/useAmazonOrderStore";
import { useRouter } from "next/navigation";

export default function AmazonOrderResultPage() {
  const router = useRouter();
  const { summary, loadFromSessionStorage, clearProcessData } = useAmazonOrderStore();

  useEffect(() => {
    if (!summary) {
      const loaded = loadFromSessionStorage();
      if (!loaded) {
        router.push("/dashboard/order-process/amazon/order-process");
      }
    }
  }, [summary, loadFromSessionStorage, router]);

  const handleReset = () => {
    router.push("/dashboard/order-process/amazon/order-process");
    setTimeout(() => {
      clearProcessData();
    }, 150);
  };

  if (!summary) return null;

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


