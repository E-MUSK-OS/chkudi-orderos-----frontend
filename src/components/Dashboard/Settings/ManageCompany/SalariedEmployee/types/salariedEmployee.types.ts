export interface AbsentRecord {
  id: string;
  employeeId: string;
  financialYear: string;
  monthName: string;
  monthIndex: number;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  periodString?: string | null;
  absentHours: number;
  overtimeHours: number;
  createdAt?: string;
  updatedAt?: string;
  // Local state helper for newly added inline rows
  isNew?: boolean;
}

export interface SalariedEmployee {
  id: string;
  userId?: string;
  fullName: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  employeeId: string;
  machineCode?: string | null;
  loginId?: string | null;
  email?: string | null;
  contactNo: string;
  aadhaarNo?: string | null;

  dob?: string | null;
  bloodGroup?: string | null;
  branch?: string | null;
  department: string;
  designation: string;
  salaryType?: string | null;
  joiningDate?: string | null;
  workerProcess?: string | null;

  // Bank
  accountNumber?: string | null;
  accountHolderName?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  accountType?: string | null;
  ifscCode?: string | null;

  // Media
  photoUrl?: string | null;
  isActive: boolean;

  // Salary & Working Details
  basicSalary: number;
  workingDayMode?: string | null;
  workingDays?: number | null;
  workingHoursPerDay?: number | null;
  totalHours?: number | null;
  wageRate?: number | null;
  otRatePercent?: number | null;
  otRatePerHour?: number | null;
  transportAllowance?: number | null;
  medicalAllowance?: number | null;

  // Absent hour records
  absentRecords?: AbsentRecord[];

  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryDetailsFormData {
  basicSalary: number;
  workingDayMode: string;
  workingDays: number;
  workingHoursPerDay: number;
  totalHours: number;
  wageRate: number;
  otRatePercent: number;
  otRatePerHour: number;
  transportAllowance: number;
  medicalAllowance: number;
}

export interface SalariedEmployeeFilterState {
  search: string;
  employeeName: string;
  status: string;
  department: string;
  page: number;
  pageSize: number;
}

