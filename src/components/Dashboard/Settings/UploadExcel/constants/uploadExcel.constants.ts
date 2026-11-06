export type ProfileKey =
  | "company"
  | "ledger"
  | "employee"
  | "salaried"
  | "material"
  | "product";

export interface ProfileMeta {
  key: ProfileKey;
  label: string;
  description: string;
}

export const PROFILES_LIST: ProfileMeta[] = [
  {
    key: "company",
    label: "Company Profile",
    description: "Manage company profiles, corporate credentials, branch tax info, and banking details.",
  },
  {
    key: "ledger",
    label: "Ledger Book",
    description: "Manage ledger accounts, party account heads, balance limits, and tax numbers.",
  },
  {
    key: "employee",
    label: "Employee Profile",
    description: "Manage employee personal records, emergency contacts, identity documents, and credentials.",
  },
  {
    key: "salaried",
    label: "Salaried Profile",
    description: "Manage salaried staff records, monthly attendance tracking, and wage structures.",
  },
  {
    key: "material",
    label: "Material Profile",
    description: "Manage raw material profiles, fabric specifications, pricing, and rack locations.",
  },
  {
    key: "product",
    label: "Product Profile",
    description: "Manage product catalog, variant SKUs, cost pricing, opening stock, and rack locations.",
  },
];

export interface SectionConfig {
  id: string;
  title: string;
  isCreate?: boolean;
  fields?: string[];
  filterKeys: ("product" | "category" | "masterSku" | "material" | "company" | "status" | "state" | "accountHead" | "department" | "employee" | "month")[];
}

export const PROFILE_SECTIONS: Record<ProfileKey, SectionConfig[]> = {
  product: [
    {
      id: "product-create",
      title: "Create New Product",
      isCreate: true,
      filterKeys: [],
    },
    {
      id: "product-sku-details",
      title: "Update Product SKU, Master SKU, Name, Category, Size, HSN, GST, Brand, etc...",
      fields: [
        "SKU",
        "Master SKU",
        "Name",
        "Category",
        "Unit",
        "Size List",
        "Gender",
        "HSN Code",
        "GST %",
        "Brand Name",
        "Active",
        "Minimum Stock",
        "Product Points",
        "Is Paired",
        "Availability",
        "Cost Applying Mode",
      ],
      filterKeys: ["product", "category", "masterSku"],
    },
    {
      id: "product-cost-pricing",
      title: "Update Product Cost, Sales Rate, MRP, Re-Order Level Stock, etc...",
      fields: [
        "Cost",
        "Sales Rate",
        "MRP",
        "Re-Order Level Stock",
        "Minimum Stock",
        "Dealer Rate",
        "Retail Rate",
      ],
      filterKeys: ["product", "category", "masterSku"],
    },
    {
      id: "product-opening-stock",
      title: "Update Product Opening Stock and Rate",
      fields: ["Opening Stock", "Opening Rate"],
      filterKeys: ["product", "category", "masterSku"],
    },
    {
      id: "product-rack-address",
      title: "Update Product Rack Address",
      fields: [],
      filterKeys: ["product", "category", "masterSku"],
    },
  ],

  material: [
    {
      id: "material-create",
      title: "Create New Material",
      isCreate: true,
      filterKeys: [],
    },
    {
      id: "material-sku-details",
      title: "Update Material SKU, Master SKU, Name, Category, Size, HSN, GST, Brand, etc...",
      fields: [
        "SKU",
        "Master SKU",
        "Material Name",
        "Category",
        "Sub Category",
        "Manufacturing Group",
        "Unit",
        "Size List",
        "Gender",
        "HSN Code",
        "GST %",
        "Brand Name",
        "Active",
        "Minimum Stock",
        "Material Points",
        "Is Paired",
        "Availability",
        "Cost Applying Mode",
        "For Use",
        "Ledger Group",
      ],
      filterKeys: ["material", "category", "masterSku"],
    },
    {
      id: "material-cost-pricing",
      title: "Update Material Cost, Sales Rate, MRP, Re-Order Level Stock, etc...",
      fields: [
        "Material Cost",
        "Sales Rate",
        "Dealer Rate",
        "Retail Rate",
        "MRP",
        "Re-Order Level Stock",
        "Minimum Stock",
        "Less %",
      ],
      filterKeys: ["material", "category", "masterSku"],
    },
    {
      id: "material-opening-stock",
      title: "Update Material Opening Stock and Rate",
      fields: ["Opening Stock", "Opening Rate"],
      filterKeys: ["material", "category", "masterSku"],
    },
    {
      id: "material-rack-address",
      title: "Update Material Rack Address",
      fields: [],
      filterKeys: ["material", "category", "masterSku"],
    },
  ],

  company: [
    {
      id: "company-create",
      title: "Create New Company",
      isCreate: true,
      filterKeys: [],
    },
    {
      id: "company-general-tax",
      title: "Update Company General, Tax & Corporate Details",
      fields: [
        "Company Code",
        "Company Name",
        "Owner Name",
        "GSTIN",
        "PAN Number",
        "Email",
        "Phone",
        "Legal Name",
        "Brand Name",
        "Business Type",
        "Website",
        "Status",
      ],
      filterKeys: ["company", "status", "state"],
    },
    {
      id: "company-addresses",
      title: "Update Company Address & Shipping Locations",
      fields: [
        "Address Line 1",
        "Address Line 2",
        "City",
        "State",
        "State Code",
        "Pincode",
        "Billing Address",
        "Shipping Address",
      ],
      filterKeys: ["company", "state"],
    },
    {
      id: "company-banking-invoice",
      title: "Update Company Banking & Invoice Configuration",
      fields: [
        "Bank Name",
        "Account Number",
        "IFSC Code",
        "Branch Name",
        "Account Type",
        "UPI ID",
        "Tax Invoice Prefix",
        "Retail Invoice Prefix",
      ],
      filterKeys: ["company", "status"],
    },
  ],

  ledger: [
    {
      id: "ledger-create",
      title: "Create New Ledger Book Accounts",
      isCreate: true,
      filterKeys: [],
    },
    {
      id: "ledger-account-details",
      title: "Update Ledger Account, Contact & Group Details",
      fields: [
        "Ledger Name",
        "Alias",
        "Account Head",
        "Email",
        "Contact Name",
        "Opening Balance",
        "Credit/Debit",
        "Credit Debit Limit",
        "Bill Due Days",
        "Ref. Name",
      ],
      filterKeys: ["accountHead", "status"],
    },
    {
      id: "ledger-tax-banking",
      title: "Update Ledger Tax & Bank Details",
      fields: [
        "GST No",
        "PAN Number",
        "MSME Number",
        "Legal Name",
        "Bank Name",
        "Account No",
        "Holder Name",
        "Branch Name",
        "IFSC Code",
        "Account Type",
      ],
      filterKeys: ["accountHead"],
    },
    {
      id: "ledger-addresses",
      title: "Update Ledger Addresses (Billing & Shipping)",
      fields: [
        "Billing Address",
        "Billing City",
        "Billing State",
        "Billing Pincode",
        "Shipping Address",
        "Shipping City",
        "Shipping State",
        "Shipping Pincode",
      ],
      filterKeys: ["accountHead"],
    },
  ],

  employee: [
    {
      id: "employee-create",
      title: "Create New Employee",
      isCreate: true,
      filterKeys: [],
    },
    {
      id: "employee-general-info",
      title: "Update Employee General & Personal Information",
      fields: [
        "Employee ID",
        "Machine Code",
        "Full Name",
        "Father Name",
        "Mother Name",
        "Gender",
        "Date of Birth",
        "Marital Status",
        "Department",
        "Designation",
        "Active Status",
      ],
      filterKeys: ["department", "status"],
    },
    {
      id: "employee-contact-identity",
      title: "Update Employee Contact & Identity Credentials",
      fields: [
        "Mobile No",
        "Emergency Contact",
        "Personal Email",
        "Present Address",
        "Permanent Address",
        "Aadhar No",
        "PAN No",
        "UAN / PF No",
        "ESIC No",
      ],
      filterKeys: ["department", "status"],
    },
    {
      id: "employee-bank-details",
      title: "Update Employee Bank Account Details",
      fields: [
        "Bank Name",
        "Account Number",
        "Account Holder Name",
        "IFSC Code",
        "Branch Name",
      ],
      filterKeys: ["department"],
    },
  ],

  salaried: [
    {
      id: "salaried-create",
      title: "Create / Upload Attendance Records",
      isCreate: true,
      filterKeys: [],
    },
    {
      id: "salaried-salary-structure",
      title: "Update Salary & Wage Structure",
      fields: [
        "Basic Salary",
        "HRA",
        "Conveyance Allowance",
        "Special Allowance",
        "Medical Allowance",
        "PF Deduction",
        "ESI Deduction",
        "Professional Tax",
        "TDS",
      ],
      filterKeys: ["department", "employee"],
    },
    {
      id: "salaried-attendance-hours",
      title: "Update Monthly Attendance & Absent / Overtime Hours",
      fields: [
        "Absent Hours",
        "Overtime Hours",
        "Working Days",
        "Paid Leave Days",
        "Unpaid Leave Days",
        "Remarks",
      ],
      filterKeys: ["month", "department"],
    },
  ],
};
