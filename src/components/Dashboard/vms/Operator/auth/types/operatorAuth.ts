export interface Operator {
  id: string;

  operatorName: string;

  employeeCode: string;

  isActive: boolean;

  isLoggedIn: boolean;
}

export interface SelectedAccount {
  id: string;

  accountName: string;
}

export interface OperatorLoginPayload {
  accountId: string;

  employeeCode: string;

  password: string;
}

export interface OperatorLoginResponse {
  success: boolean;

  message: string;

  data: {
    accessToken: string;

    operator: Operator;
  };
}

export interface OperatorMeResponse {
  success: boolean;

  data: Operator;
}

export interface OperatorResponse {
  success: boolean;

  message: string;
}