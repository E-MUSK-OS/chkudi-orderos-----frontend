export interface EmployeeDocumentItem {
  id: string;
  name: string;
  type: string;
  url: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface Employee {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  employeeId: string;
  machineCode?: string | null;
  loginId?: string | null;
  email?: string | null;
  contactNo: string;
  aadhaarNo?: string | null;

  dob?: string | null;
  bloodGroup?: string | null;
  company?: string | null;
  branch?: string | null;
  department: string;
  designation: string;
  salaryType?: string | null;
  joiningDate?: string | null;
  workerProcess?: string | null;
  basicSalary?: number | string | null;

  // Address
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  // Bank
  accountNumber?: string | null;
  accountHolderName?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  accountType?: string | null;
  ifscCode?: string | null;

  // Media
  photoUrl?: string | null;
  identityDocUrl?: string | null;
  bankDocUrl?: string | null;
  documents?: EmployeeDocumentItem[];

  // Meta
  isActive: boolean;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  // General
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
  machineCode: string;
  loginId: string;
  email: string;
  contactNo: string;
  aadhaarNo: string;
  dob: string;
  bloodGroup: string;
  company: string;
  branch: string;
  department: string;
  designation: string;
  salaryType: string;
  joiningDate: string;
  workerProcess: string;
  basicSalary?: string | number;
  isActive: boolean;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  // Bank
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: string;
  ifscCode: string;

  // Documents
  photoUrl: string;
  identityDocUrl: string;
  bankDocUrl: string;
  documents?: EmployeeDocumentItem[];
}

export interface EmployeeFilterState {
  search: string;
  employeeName: string;
  machineCode: string;
  status: string;
  department: string;
  page: number;
  pageSize: number;
}

export type EmployeeColumnKey =
  | "no"
  | "name"
  | "employeeId"
  | "designation"
  | "departments"
  | "machineCode"
  | "contactNo"
  | "aadhaarNo"
  | "status"
  | "addedEditedBy"
  | "actions";

export interface EmployeeColumnConfig {
  key: EmployeeColumnKey;
  label: string;
  visible: boolean;
}
