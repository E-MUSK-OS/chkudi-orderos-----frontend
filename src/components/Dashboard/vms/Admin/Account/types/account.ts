// ======================================================
// Account
// ======================================================

export interface Account {
  id: string;

  userId: string;
  email: string;

  accountName: string;

  createdAt: string;
  updatedAt: string;
}

// ======================================================
// Create Account
// ======================================================

export interface CreateAccountPayload {
  // userId: string;
  // email: string;

  accountName: string;
}

// ======================================================
// Update Account
// ======================================================

export interface UpdateAccountPayload {
  accountName: string;
}

// ======================================================
// API Response (Future Use)
// ======================================================

export interface AccountResponse {
  success: boolean;
  message?: string;
  data: Account;
}

export interface AccountsResponse {
  success: boolean;
  message?: string;
  data: Account[];
}