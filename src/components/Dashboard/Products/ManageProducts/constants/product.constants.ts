export const productDefaultValues = {
  productName: "",
  masterSku: "",
  sku: "",
  marketplace: ["All"] as string[],
  brand: "No Brand",
  category: "",
  subCategory: "",
  unit: "Pcs",
  sizeList: "",
  colors: [] as string[],
  gender: "",
  referenceParty: "",
  description: "",
  asin: "",
  rackAddress: "",
  generateBarcode: "No",
  mrp: "",
  mfgMonth: "",
  hsnCode: "",
  gstRate: 5,

  // Kardex details
  productCost: 0,
  dealerRate: 0,
  retailRate: 0,
  openingStock: 0,
  reorderLevelStock: 0,
  minimumStock: 0,
  productPoints: 1,
  isPaired: false,
  availability: "Public",

  isActive: true,
  attributes: [
    { attributeName: "Colour", attributeValue: "" },
    { attributeName: "Size", attributeValue: "" },
  ],
};

export interface OptionItem {
  label: string;
  value: string;
}

export const defaultMarketplaceOptions: OptionItem[] = [
  { label: "All", value: "All" },
  { label: "Myntra", value: "Myntra" },
  { label: "Amazon", value: "Amazon" },
  { label: "Flipkart", value: "Flipkart" },

];

export const marketplaceOptions = defaultMarketplaceOptions;

export const brandOptions: OptionItem[] = [
  { label: "No Brand", value: "No Brand" },
  { label: "R.Code", value: "R.Code" },
  { label: "TOPLOT", value: "TOPLOT" },
  { label: "TAGDO", value: "TAGDO" },
];

export const unitOptions: OptionItem[] = [
  { label: "Pcs", value: "Pcs" },
  { label: "Set", value: "Set" },
  { label: "Box", value: "Box" },
  { label: "Dozen", value: "Dozen" },
  { label: "Meter", value: "Meter" },
  { label: "Pair", value: "Pair" },
  { label: "Kg", value: "Kg" },
];

export const genderOptions: OptionItem[] = [
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Boys", value: "Boys" },
  { label: "Girls", value: "Girls" },
  { label: "Kids", value: "Kids" },
  { label: "Unisex", value: "Unisex" },
];

export const gstOptions: OptionItem[] = [
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "12%", value: "12" },
  { label: "18%", value: "18" },
  { label: "28%", value: "28" },
  { label: "40%", value: "40" },
];

export const availabilityOptions: OptionItem[] = [
  { label: "Public", value: "Public" },
  { label: "Private", value: "Private" },
  { label: "Wholesale", value: "Wholesale" },
];

export const rackAddressOptions: OptionItem[] = [
  { label: "Select Racks", value: "" },
  { label: "Rack A1", value: "Rack A1" },
  { label: "Rack A2", value: "Rack A2" },
  { label: "Rack B1", value: "Rack B1" },
  { label: "Rack B2", value: "Rack B2" },
  { label: "Rack C1", value: "Rack C1" },
  { label: "Floor Store", value: "Floor Store" },
];

export interface ColorPreset {
  name: string;
  hex: string;
}

export const defaultColorPresets: ColorPreset[] = [
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Magenta", hex: "#D946EF" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Beige", hex: "#D4C5B9" },
  { name: "Olive", hex: "#6B8E23" },
  { name: "Maroon", hex: "#800000" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Brown", hex: "#78350F" },
  { name: "Teal", hex: "#14B8A6" },
];

export const defaultAlphaSizes: string[] = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
];

export const defaultNumericSizes: string[] = [
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
];

export const defaultShoeSizes: string[] = [
  "UK 5",
  "UK 6",
  "UK 7",
  "UK 8",
  "UK 9",
  "UK 10",
  "UK 11",
  "UK 12",
];

export interface CategoryOption {
  label: string;
  value: string;
}

export const productCategoryOptions: CategoryOption[] = [
  { label: "Clothing & Apparel", value: "Clothing" },
  { label: "Footwear & Shoes", value: "Footwear" },
  { label: "Electronics & Gadgets", value: "Electronics" },
  { label: "Bags, Wallets & Luggage", value: "Bags & Luggage" },
  { label: "Jewellery & Watches", value: "Jewelry & Watches" },
  { label: "Beauty & Personal Care", value: "Beauty & Personal Care" },
  { label: "Home & Kitchen", value: "Home & Kitchen" },
  { label: "Sports, Fitness & Outdoors", value: "Sports & Fitness" },
  { label: "Baby & Kids Care", value: "Baby & Kids" },
  { label: "Toys & Games", value: "Toys & Games" },
  { label: "Health & Wellness", value: "Health & Wellness" },
  { label: "Grocery & Gourmet Foods", value: "Grocery & Gourmet" },
  { label: "Books & Stationery", value: "Books & Stationery" },
  { label: "Automotive & Accessories", value: "Automotive & Tools" },
  { label: "Pet Supplies", value: "Pet Supplies" },
  { label: "Office Products & Supplies", value: "Office Products" },
];

export const categoryOptions = productCategoryOptions.filter(
  (opt) => opt.value !== "other"
);

export const CATEGORY_DEFAULT_ATTRIBUTES: Record<string, [string, string]> = {
  clothing: ["Colour", "Size"],
  "clothing & apparel": ["Colour", "Size"],
  apparel: ["Colour", "Size"],
  footwear: ["Colour", "Size"],
  "footwear & shoes": ["Colour", "Size"],
  shoes: ["Colour", "Size"],
  electronics: ["Colour", "Storage"],
  "electronics & gadgets": ["Colour", "Storage"],
  "bags & luggage": ["Colour", "Capacity"],
  "bags, wallets & luggage": ["Colour", "Capacity"],
  "jewelry & watches": ["Material", "Colour"],
  "jewellery & watches": ["Material", "Colour"],
  "beauty & personal care": ["Volume", "Shade"],
  "home & kitchen": ["Colour", "Material"],
  "sports & fitness": ["Colour", "Size"],
  "sports, fitness & outdoors": ["Colour", "Size"],
  "baby & kids": ["Colour", "Size"],
  "baby & kids care": ["Colour", "Size"],
  "toys & games": ["Age Group", "Colour"],
  "health & wellness": ["Form", "Net Quantity"],
  "grocery & gourmet": ["Weight", "Flavour"],
  "grocery & gourmet foods": ["Weight", "Flavour"],
  "books & stationery": ["Format", "Language"],
  "automotive & tools": ["Model", "Colour"],
  "automotive & accessories": ["Model", "Colour"],
  "pet supplies": ["Size", "Pet Type"],
  "office products": ["Colour", "Pack Size"],
  "office products & supplies": ["Colour", "Pack Size"],
  trousers: ["Colour", "Size"],
  "co ord set": ["Colour", "Size"],
  accessories: ["Colour", "Material"],
  default: ["Colour", "Size"],
};

export const getDefaultAttributesForCategory = (category?: string): [string, string] => {
  if (!category) return ["Colour", "Size"];
  const trimmed = category.trim().toLowerCase();
  if (CATEGORY_DEFAULT_ATTRIBUTES[trimmed]) {
    return CATEGORY_DEFAULT_ATTRIBUTES[trimmed];
  }
  return ["Colour", "Size"];
};

export const CATEGORY_SUGGESTED_ATTRIBUTES: Record<string, string[]> = {
  clothing: [
    "Fabric",
    "Fit",
    "Pattern",
    "Sleeve Length",
    "Neck Type",
    "Occasion",
    "Length",
    "Waist Rise",
    "Care Instructions",
  ],
  "clothing & apparel": [
    "Fabric",
    "Fit",
    "Pattern",
    "Sleeve Length",
    "Neck Type",
    "Occasion",
    "Length",
    "Waist Rise",
    "Care Instructions",
  ],
  footwear: [
    "Upper Material",
    "Sole Material",
    "Closure Type",
    "Toe Shape",
    "Heel Type",
    "Occasion",
  ],
  "footwear & shoes": [
    "Upper Material",
    "Sole Material",
    "Closure Type",
    "Toe Shape",
    "Heel Type",
    "Occasion",
  ],
  electronics: [
    "Storage",
    "RAM",
    "Model Name",
    "Battery Capacity",
    "Screen Size",
    "Connectivity",
    "Processor",
    "Warranty",
  ],
  "electronics & gadgets": [
    "Storage",
    "RAM",
    "Model Name",
    "Battery Capacity",
    "Screen Size",
    "Connectivity",
    "Processor",
    "Warranty",
  ],
  "bags & luggage": [
    "Capacity",
    "Material",
    "Type",
    "Compartments",
    "Water Resistance",
    "Closure",
    "Dimensions",
  ],
  "bags, wallets & luggage": [
    "Capacity",
    "Material",
    "Type",
    "Compartments",
    "Water Resistance",
    "Closure",
    "Dimensions",
  ],
  "jewelry & watches": [
    "Material",
    "Strap Material",
    "Dial Colour",
    "Display Type",
    "Water Resistance",
    "Plating",
    "Occasion",
  ],
  "jewellery & watches": [
    "Material",
    "Strap Material",
    "Dial Colour",
    "Display Type",
    "Water Resistance",
    "Plating",
    "Occasion",
  ],
  "beauty & personal care": [
    "Volume",
    "Skin Type",
    "Form",
    "Fragrance",
    "Benefits",
    "SPF",
    "Finish",
  ],
  "home & kitchen": [
    "Material",
    "Dimensions",
    "Capacity",
    "Pattern",
    "Thread Count",
    "Care Instructions",
  ],
  "sports & fitness": [
    "Sport Type",
    "Material",
    "Weight",
    "Resistance",
    "Skill Level",
  ],
  "baby & kids": [
    "Age Group",
    "Fabric",
    "Material",
    "Pattern",
    "Closure",
    "Safety Standard",
  ],
  "baby & kids care": [
    "Age Group",
    "Fabric",
    "Material",
    "Pattern",
    "Closure",
    "Safety Standard",
  ],
  "toys & games": [
    "Age Group",
    "Material",
    "Skillset",
    "Battery Operated",
    "Pieces Count",
    "Character",
  ],
  "health & wellness": [
    "Form",
    "Net Quantity",
    "Flavour",
    "Diet Type",
    "Dosage",
    "Shelf Life",
  ],
  "grocery & gourmet": [
    "Weight",
    "Flavour",
    "Diet Type",
    "Package Type",
    "Shelf Life",
  ],
  "grocery & gourmet foods": [
    "Weight",
    "Flavour",
    "Diet Type",
    "Package Type",
    "Shelf Life",
  ],
  "books & stationery": [
    "Format",
    "Language",
    "Author",
    "Publisher",
    "Number of Pages",
    "Ruling Type",
  ],
  "automotive & tools": [
    "Vehicle Compatibility",
    "Material",
    "Model Year",
    "Part Number",
    "Position",
    "Warranty",
  ],
  "automotive & accessories": [
    "Vehicle Compatibility",
    "Material",
    "Model Year",
    "Part Number",
    "Position",
    "Warranty",
  ],
  "pet supplies": [
    "Pet Type",
    "Life Stage",
    "Breed Size",
    "Flavour",
    "Net Weight",
    "Material",
  ],
  "office products": [
    "Pack Size",
    "Dimensions",
    "Material",
    "Ink Color",
    "Brand",
  ],
  "office products & supplies": [
    "Pack Size",
    "Dimensions",
    "Material",
    "Ink Color",
    "Brand",
  ],
  trousers: ["Fabric", "Fit", "Waist Rise", "Pattern", "Length", "Care Instructions"],
  "co ord set": ["Fabric", "Fit", "Pattern", "Sleeve Length", "Neck Type", "Occasion"],
  accessories: ["Material", "Type", "Pattern", "Closure", "Occasion"],
  default: ["Material", "Model", "Type", "Weight", "Dimensions"],
};

export interface CategoryAttributeConfig {
  hasColors: boolean;
  colorsLabel: string;
  hasGender: boolean;
  genderLabel: string;
  hasSizeList: boolean;
  sizeLabel: string;
  defaultAttributes: Array<{ attributeName: string; attributeValue: string }>;
  suggestedAttributes: string[];
}

export const CATEGORY_ATTRIBUTE_CONFIGS: Record<string, CategoryAttributeConfig> = {
  clothing: {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size List",
    defaultAttributes: [],
    suggestedAttributes: [
      "Fabric",
      "Fit",
      "Pattern",
      "Sleeve Length",
      "Neck Type",
      "Occasion",
      "Length",
      "Waist Rise",
    ],
  },
  "clothing & apparel": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size List",
    defaultAttributes: [],
    suggestedAttributes: [
      "Fabric",
      "Fit",
      "Pattern",
      "Sleeve Length",
      "Neck Type",
      "Occasion",
      "Length",
      "Waist Rise",
    ],
  },
  trousers: {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Waist Size",
    defaultAttributes: [],
    suggestedAttributes: ["Fabric", "Fit", "Waist Rise", "Pattern", "Length", "Care Instructions"],
  },
  "co ord set": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size List",
    defaultAttributes: [],
    suggestedAttributes: ["Fabric", "Fit", "Pattern", "Sleeve Length", "Neck Type", "Occasion"],
  },
  footwear: {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Shoe Size (UK/IN)",
    defaultAttributes: [],
    suggestedAttributes: [
      "Upper Material",
      "Sole Material",
      "Closure Type",
      "Toe Shape",
      "Heel Type",
      "Occasion",
    ],
  },
  "footwear & shoes": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Shoe Size (UK/IN)",
    defaultAttributes: [],
    suggestedAttributes: [
      "Upper Material",
      "Sole Material",
      "Closure Type",
      "Toe Shape",
      "Heel Type",
      "Occasion",
    ],
  },
  electronics: {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Storage", attributeValue: "" },
      { attributeName: "RAM", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Model Name",
      "Battery Capacity",
      "Screen Size",
      "Connectivity",
      "Processor",
      "Warranty",
    ],
  },
  "electronics & gadgets": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Storage", attributeValue: "" },
      { attributeName: "RAM", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Model Name",
      "Battery Capacity",
      "Screen Size",
      "Connectivity",
      "Processor",
      "Warranty",
    ],
  },
  accessories: {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size",
    defaultAttributes: [],
    suggestedAttributes: ["Material", "Type", "Pattern", "Closure", "Occasion"],
  },
  "bags & luggage": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Capacity", attributeValue: "" },
      { attributeName: "Material", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Type",
      "Compartments",
      "Water Resistance",
      "Closure",
      "Dimensions",
      "Warranty",
    ],
  },
  "bags, wallets & luggage": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Capacity", attributeValue: "" },
      { attributeName: "Material", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Type",
      "Compartments",
      "Water Resistance",
      "Closure",
      "Dimensions",
      "Warranty",
    ],
  },
  "jewelry & watches": {
    hasColors: true,
    colorsLabel: "Color / Finish",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Material", attributeValue: "" },
      { attributeName: "Dial Colour", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Strap Material",
      "Display Type",
      "Water Resistance",
      "Plating",
      "Occasion",
    ],
  },
  "jewellery & watches": {
    hasColors: true,
    colorsLabel: "Color / Finish",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Material", attributeValue: "" },
      { attributeName: "Dial Colour", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Strap Material",
      "Display Type",
      "Water Resistance",
      "Plating",
      "Occasion",
    ],
  },
  "home & kitchen": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Material", attributeValue: "" },
      { attributeName: "Dimensions", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Capacity",
      "Pattern",
      "Thread Count",
      "Care Instructions",
    ],
  },
  "beauty & personal care": {
    hasColors: true,
    colorsLabel: "Shade / Color",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Volume", attributeValue: "" },
      { attributeName: "Skin Type", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Form",
      "Fragrance",
      "Benefits",
      "SPF",
      "Finish",
    ],
  },
  "health & wellness": {
    hasColors: false,
    colorsLabel: "",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Form", attributeValue: "" },
      { attributeName: "Net Quantity", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Flavour",
      "Diet Type",
      "Dosage",
      "Shelf Life",
    ],
  },
  "sports & fitness": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size",
    defaultAttributes: [
      { attributeName: "Sport Type", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Material",
      "Weight",
      "Resistance",
      "Skill Level",
    ],
  },
  "sports, fitness & outdoors": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size",
    defaultAttributes: [
      { attributeName: "Sport Type", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Material",
      "Weight",
      "Resistance",
      "Skill Level",
    ],
  },
  "toys & games": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Age Group", attributeValue: "" },
      { attributeName: "Material", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Skillset",
      "Battery Operated",
      "Pieces Count",
      "Character",
    ],
  },
  "baby & kids": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Age / Size",
    defaultAttributes: [
      { attributeName: "Age Group", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Fabric",
      "Material",
      "Pattern",
      "Closure",
      "Safety Standard",
    ],
  },
  "baby & kids care": {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Age / Size",
    defaultAttributes: [
      { attributeName: "Age Group", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Fabric",
      "Material",
      "Pattern",
      "Closure",
      "Safety Standard",
    ],
  },
  "books & stationery": {
    hasColors: false,
    colorsLabel: "",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Format", attributeValue: "" },
      { attributeName: "Language", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Author",
      "Publisher",
      "Number of Pages",
      "Ruling Type",
    ],
  },
  "grocery & gourmet": {
    hasColors: false,
    colorsLabel: "",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Weight", attributeValue: "" },
      { attributeName: "Diet Type", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Flavour",
      "Package Type",
      "Shelf Life",
    ],
  },
  "grocery & gourmet foods": {
    hasColors: false,
    colorsLabel: "",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Weight", attributeValue: "" },
      { attributeName: "Diet Type", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Flavour",
      "Package Type",
      "Shelf Life",
    ],
  },
  "automotive & tools": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Vehicle Compatibility", attributeValue: "" },
      { attributeName: "Material", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Model Year",
      "Part Number",
      "Position",
      "Warranty",
    ],
  },
  "automotive & accessories": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Vehicle Compatibility", attributeValue: "" },
      { attributeName: "Material", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Model Year",
      "Part Number",
      "Position",
      "Warranty",
    ],
  },
  "office products": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Pack Size", attributeValue: "" },
      { attributeName: "Dimensions", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Material",
      "Brand",
      "Ink Color",
    ],
  },
  "office products & supplies": {
    hasColors: true,
    colorsLabel: "Color",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Pack Size", attributeValue: "" },
      { attributeName: "Dimensions", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Material",
      "Brand",
      "Ink Color",
    ],
  },
  "pet supplies": {
    hasColors: false,
    colorsLabel: "",
    hasGender: false,
    genderLabel: "",
    hasSizeList: false,
    sizeLabel: "",
    defaultAttributes: [
      { attributeName: "Pet Type", attributeValue: "" },
      { attributeName: "Life Stage", attributeValue: "" },
    ],
    suggestedAttributes: [
      "Breed Size",
      "Flavour",
      "Net Weight",
      "Material",
    ],
  },
  default: {
    hasColors: true,
    colorsLabel: "Colors",
    hasGender: true,
    genderLabel: "Gender",
    hasSizeList: true,
    sizeLabel: "Size List",
    defaultAttributes: [],
    suggestedAttributes: ["Material", "Model", "Type", "Weight", "Dimensions"],
  },
};

export const getCategoryAttributeConfig = (category?: string): CategoryAttributeConfig => {
  if (!category) return CATEGORY_ATTRIBUTE_CONFIGS.clothing;
  const trimmed = category.trim().toLowerCase();
  if (CATEGORY_ATTRIBUTE_CONFIGS[trimmed]) {
    return CATEGORY_ATTRIBUTE_CONFIGS[trimmed];
  }

  // Normalization matches across marketplace names & variants
  if (
    trimmed.includes("cloth") ||
    trimmed.includes("apparel") ||
    trimmed.includes("trouser") ||
    trimmed.includes("co ord") ||
    trimmed.includes("fashion") ||
    trimmed.includes("dress") ||
    trimmed.includes("wear")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS.clothing;
  }
  if (
    trimmed.includes("footwear") ||
    trimmed.includes("shoe") ||
    trimmed.includes("sandal") ||
    trimmed.includes("sneaker")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS.footwear;
  }
  if (
    trimmed.includes("electron") ||
    trimmed.includes("mobile") ||
    trimmed.includes("gadget")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS.electronics;
  }
  if (
    trimmed.includes("bag") ||
    trimmed.includes("luggage") ||
    trimmed.includes("backpack") ||
    trimmed.includes("wallet")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["bags & luggage"];
  }
  if (trimmed.includes("jewel") || trimmed.includes("watch")) {
    return CATEGORY_ATTRIBUTE_CONFIGS["jewelry & watches"];
  }
  if (
    trimmed.includes("beaut") ||
    trimmed.includes("personal care") ||
    trimmed.includes("makeup") ||
    trimmed.includes("skin")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["beauty & personal care"];
  }
  if (trimmed.includes("home") || trimmed.includes("kitchen")) {
    return CATEGORY_ATTRIBUTE_CONFIGS["home & kitchen"];
  }
  if (
    trimmed.includes("sport") ||
    trimmed.includes("fitness") ||
    trimmed.includes("gym")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["sports & fitness"];
  }
  if (
    trimmed.includes("baby") ||
    trimmed.includes("kid") ||
    trimmed.includes("infant")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["baby & kids"];
  }
  if (trimmed.includes("toy") || trimmed.includes("game")) {
    return CATEGORY_ATTRIBUTE_CONFIGS["toys & games"];
  }
  if (
    trimmed.includes("health") ||
    trimmed.includes("wellness") ||
    trimmed.includes("ayurved")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["health & wellness"];
  }
  if (
    trimmed.includes("grocer") ||
    trimmed.includes("gourmet") ||
    trimmed.includes("food")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["grocery & gourmet"];
  }
  if (trimmed.includes("book") || trimmed.includes("station")) {
    return CATEGORY_ATTRIBUTE_CONFIGS["books & stationery"];
  }
  if (
    trimmed.includes("auto") ||
    trimmed.includes("car") ||
    trimmed.includes("bike") ||
    trimmed.includes("tool")
  ) {
    return CATEGORY_ATTRIBUTE_CONFIGS["automotive & tools"];
  }
  if (trimmed.includes("pet")) {
    return CATEGORY_ATTRIBUTE_CONFIGS["pet supplies"];
  }
  if (trimmed.includes("office")) {
    return CATEGORY_ATTRIBUTE_CONFIGS["office products"];
  }

  return CATEGORY_ATTRIBUTE_CONFIGS.default;
};

export const getCategorySuggestedAttributes = (category?: string): string[] => {
  const config = getCategoryAttributeConfig(category);
  return config.suggestedAttributes;
};

export const getAttributePlaceholder = (attributeName: string): string => {
  const lower = (attributeName || "").trim().toLowerCase();
  if (lower.includes("storage") || lower.includes("rom")) return "e.g. 64GB, 128GB, 256GB, 512GB, 1TB";
  if (lower.includes("ram") || lower.includes("memory")) return "e.g. 4GB, 6GB, 8GB, 12GB, 16GB";
  if (lower.includes("weight")) return "e.g. 250g, 500g, 1kg, 2kg, 5kg";
  if (lower.includes("flavour") || lower.includes("flavor")) return "e.g. Salted, Chocolate, Vanilla, Masala";
  if (lower.includes("volume") || lower.includes("capacity")) return "e.g. 30ml, 50ml, 100ml, 20L, 30L";
  if (lower.includes("skin type")) return "e.g. All Skin Types, Dry, Oily, Sensitive, Combination";
  if (lower.includes("hair type")) return "e.g. All Hair Types, Frizzy, Damaged, Normal";
  if (lower.includes("diet")) return "e.g. Vegetarian, Non-Vegetarian, Vegan, Gluten-Free";
  if (lower.includes("fabric") || lower.includes("upper material")) return "e.g. 100% Cotton, Rayon, Synthetic Leather, Mesh, Canvas";
  if (lower.includes("material") || lower.includes("metal")) return "e.g. Stainless Steel, Brass, Ceramic, ABS Plastic, Wood";
  if (lower.includes("sole")) return "e.g. Rubber, EVA, TPR, Phylon, Leather";
  if (lower.includes("closure")) return "e.g. Lace-Up, Slip-On, Velcro, Zipper, Buckle";
  if (lower.includes("toe")) return "e.g. Round Toe, Pointed Toe, Square Toe";
  if (lower.includes("heel")) return "e.g. Flat, Block Heel, Wedge, Platform";
  if (lower.includes("fit")) return "e.g. Slim Fit, Regular Fit, Relaxed Fit, Oversized";
  if (lower.includes("pattern")) return "e.g. Solid, Striped, Printed, Checked, Floral";
  if (lower.includes("sleeve")) return "e.g. Full Sleeve, Half Sleeve, Sleeveless, 3/4th Sleeve";
  if (lower.includes("neck") || lower.includes("collar")) return "e.g. Round Neck, Polo Collar, V-Neck, Mandarin Collar";
  if (lower.includes("strap")) return "e.g. Genuine Leather, Stainless Steel Mesh, Silicone";
  if (lower.includes("dial")) return "e.g. Black Dial, Blue Dial, White Dial, Analog, Digital";
  if (lower.includes("water resistance")) return "e.g. 30m / 3 ATM, 50m / 5 ATM, Water Resistant";
  if (lower.includes("format")) return "e.g. Paperback, Hardcover, Spiral Bound";
  if (lower.includes("language")) return "e.g. English, Hindi, Sanskrit";
  if (lower.includes("age")) return "e.g. 0-6 Months, 1-3 Years, 3-6 Years, 8+ Years";
  if (lower.includes("model")) return "e.g. Series X, Pro Max, 2024 Edition";
  if (lower.includes("battery")) return "e.g. 5000 mAh, 4500 mAh, 6000 mAh";
  if (lower.includes("screen")) return "e.g. 6.1 inch, 6.7 inch, 15.6 inch";
  if (lower.includes("connectivity")) return "e.g. 5G, Wi-Fi 6, Bluetooth 5.3, USB-C";
  if (lower.includes("processor")) return "e.g. Snapdragon, Apple A-Series, Intel i5/i7";
  if (lower.includes("warranty")) return "e.g. 1 Year Brand Warranty";
  if (lower.includes("dimension")) return "e.g. 45x30x18 cm, King Size, A4";
  if (lower.includes("pack") || lower.includes("quantity")) return "e.g. Pack of 1, Pack of 5, 60 Capsules";
  if (lower.includes("sport")) return "e.g. Gym & Training, Yoga, Running, Cricket";
  if (lower.includes("vehicle")) return "e.g. Universal, Royal Enfield, Swift, Two-Wheeler";
  if (lower.includes("shelf life")) return "e.g. 6 Months, 12 Months, 24 Months";
  if (lower.includes("spf")) return "e.g. SPF 30, SPF 50 PA+++";
  if (lower.includes("form")) return "e.g. Serum, Cream, Gel, Capsule, Powder, Liquid";
  if (lower.includes("fragrance")) return "e.g. Unscented, Citrus, Floral, Rose, Vanilla";
  return `Enter ${attributeName} value(s), e.g. Cotton, Silk, 128GB...`;
};
