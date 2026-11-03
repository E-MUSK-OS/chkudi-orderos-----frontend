export type UserRole = "SUPERADMIN" | "ADMIN" | "USER";

export interface ManagedUser {
  id: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName: string;
  username: string;
  email: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  departments: string[];
  companies: string[];
  avatar?: string | null;
  role: UserRole;
  allowedPages: string[];
  rights?: string | null;
  createdById?: string | null;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  userMapping?: {
    superAdminId?: string | null;
    adminId?: string | null;
    allowedPages?: string[];
    departments?: string[];
    companies?: string[];
    superAdmin?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
      role: UserRole;
    } | null;
    admin?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
      role: UserRole;
    } | null;
  } | null;
  superAdmin?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    role: UserRole;
  } | null;
  admin?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    role: UserRole;
  } | null;
  managedUsers?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    isActive: boolean;
  }[];
  adminMappings?: {
    userId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    };
  }[];
}

export interface UserFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  dob?: string;
  gender?: string;
  departments: string[];
  companies: string[];
  role: UserRole;
  allowedPages: string[];
  rights?: string;
  avatar?: string;
  isActive: boolean;
}

export const DEPARTMENT_OPTIONS = [
  "Admin",
  "Inventory",
  "Production [Overall]",
  "Accounts",
  "Marketing & Sales",
  "Maintenance",
  "HR",
  "Production [Sub-Stitching]",
  "Sales & Dispatched",
];

export const COMPANY_OPTIONS = [
  "R.Code",
  "TOPLOT",
  "TAGDO",
  "Jay Bhavani Fashion",
  "Other",
];

export const PAGE_ACCESS_OPTIONS = [
  { id: "ALL", label: "ALL (Full Access)" },
  { id: "dashboard", label: "Dashboard (Home)" },
  { id: "profile", label: "Account - Profile" },
  { id: "warehouse", label: "Account - Warehouse" },
  { id: "wallet", label: "Account - Wallet" },
  { id: "notification", label: "Account - Notification" },
  { id: "vms", label: "VMS - Dashboard" },
  { id: "vms/scans", label: "VMS - Scans (VMS Scan)" },
  { id: "vms/scans/trackingid-scan", label: "VMS - Tracking ID Scan" },
  { id: "vms/operator", label: "VMS - Operator" },
  { id: "vms/admin", label: "VMS - Admin" },
  { id: "vms/admin/users", label: "VMS - Admin: Users" },
  { id: "vms/admin/account", label: "VMS - Admin: Accounts Name" },
  { id: "products/inventory", label: "Products - Inventory" },
  { id: "settings/manage-product", label: "Products - Product Profile" },
  { id: "order-process", label: "Order Process - Dashboard" },
  { id: "order-process/myntra/manage-tag-loop", label: "Myntra - Manage Tag Loop" },
  { id: "order-process/myntra/myntra-order", label: "Myntra - Myntra Order" },
  { id: "order-process/myntra/myntra-picklist", label: "Myntra - Myntra Picklist" },
  { id: "order-process/myntra/stock-analysis", label: "Myntra - Stock Analysis" },
  { id: "order-process/myntra/invoice-formatter", label: "Myntra - Invoice Formatter" },
  { id: "order-process/amazon/order-process", label: "Amazon - Order Process" },
  { id: "order-process/amazon/awb-scan", label: "Amazon - AWB Scan" },
  { id: "products-analytics/amazon", label: "Products Analytics - Amazon" },
  { id: "transaction/sales/po-based", label: "Transaction - Sales PO Based" },
  { id: "offline-sales/sales-challan", label: "Offline Sales - Sales Challan" },
  { id: "offline-sales/sales-invoice", label: "Offline Sales - Sales Invoice" },
  { id: "purchase/finish-goods/challan", label: "Purchase - Purchase Challan" },
  { id: "purchase/finish-goods/invoice", label: "Purchase - Purchase Invoice" },
  { id: "settings/webstore", label: "Settings - Webstore" },
  { id: "settings/labels/label-config", label: "Settings - Label Config" },
  { id: "settings/labels/label-print", label: "Settings - Label Print" },
  { id: "settings/manage-users", label: "Settings - Manage Users" },
];

