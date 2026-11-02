export const categoryOptions = [
  "No Category",
];

export const subCategoryOptions = [
  "No Sub Category",
];

export const manufacturingGroupOptions = [
  "No Manufacturing Group",
];

export const unitOptions = [
  "No Unit",
];

export const gstRateOptions = [
  { label: "0%", value: 0 },
  { label: "5%", value: 5 },
  { label: "12%", value: 12 },
  { label: "18%", value: 18 },
  { label: "28%", value: 28 },
];

export const brandOptions = [
  "No Brand",
];

export const forUseOptions = [
  "No For Use",
];

export const costApplyingModeOptions = [
  "No Cost Applying Mode",
];

export const purchaseTypeOptions = [
  "No Purchase Type",
];

export const issueModeOptions = [
  "No Issue Mode",
];

export const consumptionModeOptions = [
  "No Consumption Mode",
];

export const defaultColorPresets = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#FBBF24" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Brown", hex: "#78350F" },
  { name: "Maroon", hex: "#800000" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Sky Blue", hex: "#38BDF8" },
  { name: "Cream", hex: "#FFFDD0" },
];

export const materialDefaultValues = {
  sku: "",
  masterSku: "",
  materialName: "",
  category: "No Category",
  subCategory: "No Sub Category",
  manufacturingGroup: "No Manufacturing Group",
  unit: "No Unit",
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
  forUse: "No For Use",
  less: 0,
  description: "",

  costApplyingMode: "No Cost Applying Mode",
  materialCost: 0,
  mrp: "0",
  salesRate: 0,
  reorderLevelStock: 0,
  purchaseType: "No Purchase Type",
  isStockDetailsCompulsory: false,
  issueMode: "No Issue Mode",
  consumptionMode: "No Consumption Mode",
  isIssuable: false,
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

export const defaultMarketplaceOptions = [
  { label: "All", value: "All" },
];
