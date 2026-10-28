"use client";

import React from "react";
import ViewChallanModal from "@/components/Dashboard/common/ViewChallanModal";
import { SalesChallan } from "../types/challan.types";

interface ViewSalesChallanModalProps {
  open: boolean;
  challan: SalesChallan | null;
  loading?: boolean;
  onClose: () => void;
  onEdit?: (challan: SalesChallan) => void;
}

export default function ViewSalesChallanModal({
  open,
  challan,
  loading,
  onClose,
  onEdit,
}: ViewSalesChallanModalProps) {
  return (
    <ViewChallanModal
      open={open}
      type="Sales"
      challan={challan}
      loading={loading}
      onClose={onClose}
      onEdit={onEdit}
    />
  );
}
