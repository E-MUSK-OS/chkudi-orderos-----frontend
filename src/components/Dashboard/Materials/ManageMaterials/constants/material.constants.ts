export const categoryOptions: string[] = [];

export const subCategoryOptions: string[] = [];

export const manufacturingGroupOptions: string[] = [];

export const unitOptions: string[] = [];

export const gstRateOptions: Array<{ label: string; value: number }> = [];

export const brandOptions: string[] = [];

export const forUseOptions: string[] = [];

export const costApplyingModeOptions: string[] = [];

export const purchaseTypeOptions: string[] = [];

export const issueModeOptions: string[] = [];

export const consumptionModeOptions: string[] = [];

export const defaultColorPresets = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Green", hex: "#10B981" },
  { name: "Red", hex: "#EF4444" },
  { name: "Sky-blue", hex: "#38BDF8" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Maroon", hex: "#800000" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Navy blue", hex: "#1E3A8A" },
  { name: "Gold", hex: "#EAB308" },
  { name: "Clear", hex: "#E5E7EB" },
  { name: "Silver", hex: "#9CA3AF" },
  { name: "Brown", hex: "#78350F" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Magenta", hex: "#D946EF" },
  { name: "Yellow", hex: "#FBBF24" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#8B5CF6" },
];

export const materialDefaultValues = {
  sku: "",
  masterSku: "",
  materialName: "",
  category: "",
  subCategory: "",
  manufacturingGroup: "Fabric",
  unit: "Pcs",
  colors: [] as string[],
  sizeList: "",
  attributes: [] as Array<{ id?: string; attributeName: string; attributeValue: string }>,
  width: 0,
  widthRangeFrom: 0,
  widthRangeTo: 0,
  gsm: 0,
  gsmRangeFrom: 0,
  gsmRangeTo: 0,
  gstRate: 5,
  hsnCode: "",
  brand: "No Brand",
  forUse: "",
  less: 0,
  description: "",

  costApplyingMode: "Weighted Average",
  materialCost: 0,
  mrp: "0",
  salesRate: 0,
  reorderLevelStock: 0,
  purchaseType: "Regular Purchase",
  isStockDetailsCompulsory: false,
  issueMode: "Direct",
  consumptionMode: "Direct",
  isSellable: false,

  isActive: true,
};

export const defaultMaterialAttributes = [
  "Size",
  "Dimension",
  "Thickness",
  "Capacity",
  "Composition",
  "Count",
  "Grade",
  "Pattern",
  "Finish",
];

export const getDefaultAttributesForCategory = (cat?: string): string[] => defaultMaterialAttributes;

export const productCategoryOptions = categoryOptions.map((c) => ({
  label: c,
  value: c,
}));

export const defaultMarketplaceOptions: Array<{ label: string; value: string }> = [];
