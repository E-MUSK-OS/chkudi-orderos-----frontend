import { FieldGroup } from "../types/settingMasters.types";

export const normalizeFieldKey = (key: string): string => {
  const clean = String(key || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean === "productcategory") return "category";
  if (clean === "colour" || clean === "colours") return "color";
  if (clean === "brandname") return "brand";
  if (clean === "companyname") return "company";
  if (clean === "userdepartment") return "department";
  if (clean === "sizes" || clean === "sizelist") return "size";
  if (clean === "gst") return "gstrate";
  return clean;
};

// Comprehensive mapping of known normalized field keys to clean human labels
export const KNOWN_FIELD_LABELS: Record<string, string> = {
  accounthead: "Account Head",
  accounttype: "Account Type",
  advertisement: "Advertisement",
  agentbrokercontractor: "Agent/Broker/Contractor",
  availability: "Availability",
  balancetype: "Balance Type",
  bankac: "Bank A/C",
  basketgroups: "Basket Groups",
  baskets: "Baskets",
  bloodgroup: "Blood Group",
  branch: "Branch",
  brand: "Brand Name",
  buildings: "Buildings",
  businesstype: "Business Type",
  capitalac: "Capital A/C",
  cashac: "Cash A/C",
  challanfor: "Challan For",
  closingstock: "Closing Stock",
  color: "Color",
  company: "Company Name",
  considerinpnl: "Consider In P&L",
  consumptionmode: "Consumption Mode",
  costapplyingmode: "Cost Applying Mode",
  department: "Department",
  designation: "Designation",
  dutiesandtaxes: "Duties And Taxes",
  employee: "Employee",
  employeedesignation: "Employee Designation",
  expenseac: "Expense A/C",
  expenseacpnl: "Expense A/C (P & L)",
  foruse: "For Use",
  gender: "Gender",
  gstrate: "GST Rate (%)",
  issuemode: "Issue Mode",
  ledgergroup: "Ledger Group",
  manufacturinggroup: "Manufacturing Group",
  marketplace: "Marketplace",
  materialcategory: "Material Category",
  materialsubcategory: "Material Sub-Category",
  category: "Product Category",
  purchasetype: "Purchase Type",
  rackaddress: "Rack Address",
  referenceparty: "Reference Party",
  salarytype: "Salary Type",
  size: "Size List",
  stockin: "Stock In",
  stockoutfrom: "Stock Out From",
  tradecategory: "Trade Category",
  unit: "Unit",
  workerprocess: "Worker Process",
};

// Smart Humanizer that dynamically formats any camelCase, PascalCase, snake_case,
// or fused lowercase field key into a pristine human-readable title
export const humanizeFieldKey = (rawKey: string): string => {
  if (!rawKey) return "";
  const norm = normalizeFieldKey(rawKey);
  if (KNOWN_FIELD_LABELS[norm]) return KNOWN_FIELD_LABELS[norm];

  // 1. Separate camelCase, PascalCase, snake_case, kebab-case
  let spaced = String(rawKey)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  // 2. If it's still a fused all-lowercase word, segment using common inventory/business vocabulary
  if (!spaced.includes(" ") && /^[a-z0-9]+$/i.test(spaced)) {
    const knownWords = [
      "subcategory", "manufacturing", "category", "group", "cost", "applying", "mode",
      "issue", "consumption", "purchase", "type", "for", "use", "reference", "party",
      "rack", "address", "gst", "rate", "brand", "unit", "size", "gender", "color",
      "business", "trade", "account", "head", "employee", "designation", "salary",
      "worker", "process", "branch", "blood", "company", "department",
      "challan", "stock", "out", "from", "in", "balance", "consider", "pnl",
      "advertisement", "agent", "broker", "contractor", "bank", "basket", "baskets",
      "building", "buildings", "capital", "cash", "closing", "duties", "taxes", "tax",
      "expense", "partner", "courier", "warehouse", "zone", "status", "order",
      "package", "packages", "pack", "packing", "item", "vendor", "customer",
      "payment", "gateway", "shipping", "delivery", "carrier", "transport"
    ];
    knownWords.sort((a, b) => b.length - a.length);

    let remaining = spaced.toLowerCase();
    const segments: string[] = [];
    while (remaining.length > 0) {
      const match = knownWords.find((w) => remaining.startsWith(w));
      if (match) {
        segments.push(match);
        remaining = remaining.slice(match.length);
      } else {
        segments.push(remaining);
        break;
      }
    }
    if (segments.length > 1) {
      spaced = segments.join(" ");
    }
  }

  // 3. Title-case words while preserving standard business acronyms
  return spaced
    .split(/\s+/)
    .map((word) => {
      const wLower = word.toLowerCase();
      if (wLower === "gst") return "GST";
      if (wLower === "ac") return "A/C";
      if (wLower === "pnl") return "(P & L)";
      if (wLower === "dr") return "Dr";
      if (wLower === "cr") return "Cr";
      if (wLower === "id") return "ID";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
};

export const INITIAL_FIELD_GROUPS: FieldGroup[] = [
  { id: "accounthead", no: 1, field: "accounthead", label: "Account Head", totalCount: 6, activeCount: 6 },
  { id: "accounttype", no: 2, field: "accounttype", label: "Account Type", totalCount: 4, activeCount: 4 },
  { id: "advertisement", no: 3, field: "advertisement", label: "Advertisement", totalCount: 4, activeCount: 4 },
  { id: "agentbrokercontractor", no: 4, field: "agentbrokercontractor", label: "Agent/Broker/Contractor", totalCount: 3, activeCount: 3 },
  { id: "availability", no: 5, field: "availability", label: "Availability", totalCount: 3, activeCount: 3 },
  { id: "balancetype", no: 6, field: "balancetype", label: "Balance Type", totalCount: 2, activeCount: 2 },
  { id: "bankac", no: 7, field: "bankac", label: "Bank A/C", totalCount: 5, activeCount: 5 },
  { id: "basketgroups", no: 8, field: "basketgroups", label: "Basket Groups", totalCount: 3, activeCount: 3 },
  { id: "baskets", no: 9, field: "baskets", label: "Baskets", totalCount: 4, activeCount: 4 },
  { id: "bloodgroup", no: 10, field: "bloodgroup", label: "Blood Group", totalCount: 8, activeCount: 8 },
  { id: "branch", no: 11, field: "branch", label: "Branch", totalCount: 3, activeCount: 3 },
  { id: "brand", no: 12, field: "brand", label: "Brand Name", totalCount: 0, activeCount: 0 },
  { id: "buildings", no: 13, field: "buildings", label: "Buildings", totalCount: 4, activeCount: 4 },
  { id: "businesstype", no: 14, field: "businesstype", label: "Business Type", totalCount: 6, activeCount: 6 },
  { id: "capitalac", no: 15, field: "capitalac", label: "Capital A/C", totalCount: 3, activeCount: 3 },
  { id: "cashac", no: 16, field: "cashac", label: "Cash A/C", totalCount: 3, activeCount: 3 },
  { id: "challanfor", no: 17, field: "challanfor", label: "Challan For", totalCount: 6, activeCount: 6 },
  { id: "closingstock", no: 18, field: "closingstock", label: "Closing Stock", totalCount: 3, activeCount: 3 },
  { id: "color", no: 19, field: "color", label: "Color", totalCount: 23, activeCount: 23 },
  { id: "company", no: 20, field: "company", label: "Company Name", totalCount: 0, activeCount: 0 },
  { id: "considerinpnl", no: 21, field: "considerinpnl", label: "Consider In P&L", totalCount: 2, activeCount: 2 },
  { id: "consumptionmode", no: 22, field: "consumptionmode", label: "Consumption Mode", totalCount: 8, activeCount: 8 },
  { id: "costapplyingmode", no: 23, field: "costapplyingmode", label: "Cost Applying Mode", totalCount: 7, activeCount: 7 },
  { id: "department", no: 24, field: "department", label: "Department", totalCount: 14, activeCount: 14 },
  { id: "designation", no: 25, field: "designation", label: "Designation", totalCount: 7, activeCount: 7 },
  { id: "dutiesandtaxes", no: 26, field: "dutiesandtaxes", label: "Duties And Taxes", totalCount: 5, activeCount: 5 },
  { id: "employee", no: 27, field: "employee", label: "Employee", totalCount: 3, activeCount: 3 },
  { id: "employeedesignation", no: 28, field: "employeedesignation", label: "Employee Designation", totalCount: 7, activeCount: 7 },
  { id: "expenseac", no: 29, field: "expenseac", label: "Expense A/C", totalCount: 5, activeCount: 5 },
  { id: "expenseacpnl", no: 30, field: "expenseacpnl", label: "Expense A/C (P & L)", totalCount: 4, activeCount: 4 },
  { id: "foruse", no: 31, field: "foruse", label: "For Use", totalCount: 6, activeCount: 6 },
  { id: "gender", no: 32, field: "gender", label: "Gender", totalCount: 6, activeCount: 6 },
  { id: "gstrate", no: 33, field: "gstrate", label: "GST Rate (%)", totalCount: 6, activeCount: 6 },
  { id: "issuemode", no: 34, field: "issuemode", label: "Issue Mode", totalCount: 6, activeCount: 6 },
  { id: "ledgergroup", no: 35, field: "ledgergroup", label: "Ledger Group", totalCount: 5, activeCount: 5 },
  { id: "manufacturinggroup", no: 36, field: "manufacturinggroup", label: "Manufacturing Group", totalCount: 12, activeCount: 12 },
  { id: "marketplace", no: 37, field: "marketplace", label: "Marketplace", totalCount: 4, activeCount: 4 },
  { id: "materialcategory", no: 38, field: "materialcategory", label: "Material Category", totalCount: 9, activeCount: 9 },
  { id: "materialsubcategory", no: 39, field: "materialsubcategory", label: "Material Sub-Category", totalCount: 9, activeCount: 9 },
  { id: "category", no: 40, field: "category", label: "Product Category", totalCount: 15, activeCount: 15 },
  { id: "purchasetype", no: 41, field: "purchasetype", label: "Purchase Type", totalCount: 8, activeCount: 8 },
  { id: "rackaddress", no: 42, field: "rackaddress", label: "Rack Address", totalCount: 0, activeCount: 0 },
  { id: "referenceparty", no: 43, field: "referenceparty", label: "Reference Party", totalCount: 0, activeCount: 0 },
  { id: "salarytype", no: 44, field: "salarytype", label: "Salary Type", totalCount: 4, activeCount: 4 },
  { id: "size", no: 45, field: "size", label: "Size List", totalCount: 14, activeCount: 14 },
  { id: "stockin", no: 46, field: "stockin", label: "Stock In", totalCount: 1, activeCount: 1 },
  { id: "stockoutfrom", no: 47, field: "stockoutfrom", label: "Stock Out From", totalCount: 1, activeCount: 1 },
  { id: "tradecategory", no: 48, field: "tradecategory", label: "Trade Category", totalCount: 5, activeCount: 5 },
  { id: "unit", no: 49, field: "unit", label: "Unit", totalCount: 13, activeCount: 13 },
  { id: "workerprocess", no: 50, field: "workerprocess", label: "Worker Process", totalCount: 6, activeCount: 6 },
];
