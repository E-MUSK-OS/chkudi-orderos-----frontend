export interface MaterialOrderDeskSummaryRow {
  sku: string;
  materialId?: string | null;
  category: "Fabric" | "Trim";
  unit: string;
  requiredQty: number;
  issueQty: number;
  stock: number;
  poQty: number;
  shortSurplus: number;
}

export interface MaterialOrderDeskSummaryResponse {
  category: "Fabric" | "Trim";
  selectedLotCount: number;
  rows: MaterialOrderDeskSummaryRow[];
  sumRequiredQty: number;
  sumIssueQty: number;
  sumStock: number;
  sumPoQty: number;
  sumShortSurplus: number;
}

export interface MaterialOrderDeskRequirementItem {
  id?: string;
  materialId?: string | null;
  sku: string;
  category: "Fabric" | "Trim";
  unit?: string;
  requiredQty: number;
  issueQty: number;
}

export interface MaterialOrderDeskLot {
  id: string;
  lotNo: string;
  masterSku: string;
  productSku: string;
  quantity: number;
  status: string;
  isSelected: boolean;
  requirements?: MaterialOrderDeskRequirementItem[];
  createdAt?: string;
}

export interface MaterialOrderDeskLotsResponse {
  lots: MaterialOrderDeskLot[];
  masterSkus: string[];
  productSkus: string[];
}
