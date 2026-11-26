"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import SalesOrderCreateForm from "@/components/Dashboard/OfflineSales/SalesOrder/components/SalesOrderCreateForm";

export default function NewSalesOrderPage() {
  const router = useRouter();
  const listPath = "/dashboard/offline-sales/sales-order";

  return (
    <DashboardLayout title="Create Sales Order">
      <SalesOrderCreateForm
        onSuccess={() => router.push(listPath)}
        onCancel={() => router.push(listPath)}
      />
    </DashboardLayout>
  );
}
