"use client";

import React from "react";
import ViewChallanModal from "@/components/Dashboard/common/ViewChallanModal";
import { PurchaseChallan } from "../types/purchaseChallan.types";

interface ViewPurchaseChallanModalProps {
  open: boolean;
  challan: PurchaseChallan | null;
  loading?: boolean;
  onClose: () => void;
  onEdit?: (challan: PurchaseChallan) => void;
}

export default function ViewPurchaseChallanModal({
  open,
  challan,
  loading,
  onClose,
  onEdit,
}: ViewPurchaseChallanModalProps) {
  return (
    <ViewChallanModal
      open={open}
      type="Purchase"
      challan={challan}
      loading={loading}
      onClose={onClose}
      onEdit={onEdit}
    />
  );
}
