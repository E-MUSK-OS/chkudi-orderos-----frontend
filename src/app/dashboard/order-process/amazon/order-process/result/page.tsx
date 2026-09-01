"use client";

import { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ComparisonResultView from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/components/ComparisonResultView";
import { useAmazonOrderStore } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/store/useAmazonOrderStore";
import { useRouter } from "next/navigation";

export default function AmazonOrderResultPage() {
  const router = useRouter();
  const { summary, loadFromSessionStorage } = useAmazonOrderStore();

  useEffect(() => {
    if (!summary) {
      loadFromSessionStorage();
    }
  }, [summary, loadFromSessionStorage]);

  return (
    <DashboardLayout title="Amazon Order Verification Results">
      <div className="space-y-6">
        <ComparisonResultView
          isStandaloneTab={true}
          onReset={() => {
            router.push("/dashboard/order-process/amazon/order-process");
          }}
        />
      </div>
    </DashboardLayout>
  );
}

