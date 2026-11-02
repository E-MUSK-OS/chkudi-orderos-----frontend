import { FieldGroup } from "../types/settingMasters.types";

export const normalizeFieldKey = (key: string): string => {
  return String(key || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const KNOWN_FIELD_LABELS: Record<string, string> = {
  advertisement: "Advertisement",
  agentbrokercontractor: "Agent/Broker/Contractor",
  bankac: "Bank A/C",
  basketgroups: "Basket Groups",
  baskets: "Baskets",
  buildings: "Buildings",
  capitalac: "Capital A/C",
  cashac: "Cash A/C",
  closingstock: "Closing Stock",
  color: "Color",
  company: "Company Name",
  dutiesandtaxes: "Duties And Taxes",
  employee: "Employee",
  employeedesignation: "Employee Designation",
  expenseac: "Expense A/C",
  expenseacpnl: "Expense A/C (P & L)",
  category: "Product Category",
  subcategory: "Product Sub-Category",
  brand: "Brand Name",
  unit: "Unit",
  size: "Size List",
  gender: "Gender",
  rackaddress: "Rack Address",
  availability: "Availability",
  gstrate: "GST Rate (%)",
  referenceparty: "Reference Party",
  manufacturinggroup: "Manufacturing Group",
  ledgergroup: "Ledger Group",
  costapplyingmode: "Cost Applying Mode",
  purchasetype: "Purchase Type",
  issuemode: "Issue Mode",
  consumptionmode: "Consumption Mode",
  department: "Department",
  branch: "Branch",
  challanfor: "Challan For",
};

export const humanizeFieldKey = (rawKey: string): string => {
  if (!rawKey) return "";
  const norm = normalizeFieldKey(rawKey);
  if (KNOWN_FIELD_LABELS[norm]) return KNOWN_FIELD_LABELS[norm];

  return rawKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

export const INITIAL_FIELD_GROUPS: FieldGroup[] = [
  { id: "advertisement", no: 1, field: "advertisement", label: "Advertisement", totalCount: 4, activeCount: 4 },
  { id: "agentbrokercontractor", no: 2, field: "agentbrokercontractor", label: "Agent/Broker/Contractor", totalCount: 3, activeCount: 3 },
  { id: "bankac", no: 3, field: "bankac", label: "Bank A/C", totalCount: 5, activeCount: 5 },
  { id: "basketgroups", no: 4, field: "basketgroups", label: "Basket Groups", totalCount: 3, activeCount: 3 },
  { id: "baskets", no: 5, field: "baskets", label: "Baskets", totalCount: 4, activeCount: 4 },
  { id: "buildings", no: 6, field: "buildings", label: "Buildings", totalCount: 4, activeCount: 4 },
  { id: "capitalac", no: 7, field: "capitalac", label: "Capital A/C", totalCount: 3, activeCount: 3 },
  { id: "cashac", no: 8, field: "cashac", label: "Cash A/C", totalCount: 3, activeCount: 3 },
  { id: "closingstock", no: 9, field: "closingstock", label: "Closing Stock", totalCount: 3, activeCount: 3 },
  { id: "color", no: 10, field: "color", label: "Color", totalCount: 23, activeCount: 23 },
  { id: "company", no: 11, field: "company", label: "Company Name", totalCount: 4, activeCount: 4 },
  { id: "dutiesandtaxes", no: 12, field: "dutiesandtaxes", label: "Duties And Taxes", totalCount: 5, activeCount: 5 },
  { id: "employee", no: 13, field: "employee", label: "Employee", totalCount: 3, activeCount: 3 },
  { id: "employeedesignation", no: 14, field: "employeedesignation", label: "Employee Designation", totalCount: 7, activeCount: 7 },
  { id: "expenseac", no: 15, field: "expenseac", label: "Expense A/C", totalCount: 5, activeCount: 5 },
  { id: "expenseacpnl", no: 16, field: "expenseacpnl", label: "Expense A/C (P & L)", totalCount: 4, activeCount: 4 },
  { id: "category", no: 17, field: "category", label: "Product Category", totalCount: 15, activeCount: 15 },
  { id: "subcategory", no: 18, field: "subcategory", label: "Product Sub-Category", totalCount: 7, activeCount: 7 },
  { id: "brand", no: 19, field: "brand", label: "Brand Name", totalCount: 4, activeCount: 4 },
  { id: "unit", no: 20, field: "unit", label: "Unit", totalCount: 7, activeCount: 7 },
  { id: "size", no: 21, field: "size", label: "Size List", totalCount: 14, activeCount: 14 },
  { id: "gender", no: 22, field: "gender", label: "Gender", totalCount: 6, activeCount: 6 },
  { id: "rackaddress", no: 23, field: "rackaddress", label: "Rack Address", totalCount: 6, activeCount: 6 },
  { id: "availability", no: 24, field: "availability", label: "Availability", totalCount: 3, activeCount: 3 },
  { id: "gstrate", no: 25, field: "gstrate", label: "GST Rate (%)", totalCount: 6, activeCount: 6 },
  { id: "referenceparty", no: 26, field: "referenceparty", label: "Reference Party", totalCount: 3, activeCount: 3 },
  { id: "manufacturinggroup", no: 27, field: "manufacturinggroup", label: "Manufacturing Group", totalCount: 5, activeCount: 5 },
  { id: "ledgergroup", no: 28, field: "ledgergroup", label: "Ledger Group", totalCount: 5, activeCount: 5 },
  { id: "costapplyingmode", no: 29, field: "costapplyingmode", label: "Cost Applying Mode", totalCount: 5, activeCount: 5 },
  { id: "purchasetype", no: 30, field: "purchasetype", label: "Purchase Type", totalCount: 5, activeCount: 5 },
  { id: "issuemode", no: 31, field: "issuemode", label: "Issue Mode", totalCount: 4, activeCount: 4 },
  { id: "consumptionmode", no: 32, field: "consumptionmode", label: "Consumption Mode", totalCount: 4, activeCount: 4 },
  { id: "department", no: 33, field: "department", label: "Department", totalCount: 11, activeCount: 11 },
  { id: "branch", no: 34, field: "branch", label: "Branch", totalCount: 3, activeCount: 3 },
  { id: "challanfor", no: 35, field: "challanfor", label: "Challan For", totalCount: 6, activeCount: 6 },
];
