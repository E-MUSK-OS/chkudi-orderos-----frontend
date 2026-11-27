import React from "react";
import { Metadata } from "next";
import MaterialOrderDeskPage from "@/components/Dashboard/Purchase/Material/OrderDesk/MaterialOrderDeskPage";

export const metadata: Metadata = {
  title: "Order Desk [ Purchase Material ] | OrderOS",
  description: "Manage purchase material order desk",
};

export default function MaterialOrderDeskRoutePage() {
  return <MaterialOrderDeskPage />;
}
