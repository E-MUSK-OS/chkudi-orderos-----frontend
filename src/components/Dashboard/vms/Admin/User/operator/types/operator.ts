// ======================================================
// Operator
// ======================================================

export interface Operator {
  id: string;

  operatorName: string;
  employeeCode: string;

  isActive: boolean;
  isLoggedIn: boolean;

  createdAt: string;
  updatedAt: string;
}

// ======================================================
// Create Operator
// ======================================================

export interface CreateOperatorPayload {
  operatorName: string;
  employeeCode: string;
  password: string;
}

// ======================================================
// Update Operator
// ======================================================

export interface UpdateOperatorPayload {
  operatorName?: string;
  employeeCode?: string;
  isActive?: boolean;
}

// ======================================================
// API Response
// ======================================================

export interface OperatorResponse {
  success: boolean;
  message?: string;
  data: Operator;
}

export interface OperatorsResponse {
  success: boolean;
  data: Operator[];
  message?: string;
}