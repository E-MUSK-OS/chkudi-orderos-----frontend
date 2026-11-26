import PurchaseOrderPage from "@/components/Dashboard/Purchase/PurchaseOrder/PurchaseOrderPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order [ Purchase Product ] | OrderOS",
  description: "Manage purchase finishgood orders",
};

export default function OrderPage() {
  return <PurchaseOrderPage />;
}
