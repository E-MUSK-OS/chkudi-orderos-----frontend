export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ApiResponseWithData<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface VerifyOtpApiResponse {
  success: boolean;
  message: string;
  resetToken: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  username?: string;
  role?: string;
  allowedPages?: string[];
  avatar?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  departments?: string[];
  companies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SendOtpRequest {
  email: string;
  purpose: "EMAIL_VERIFICATION" | "FORGOT_PASSWORD";
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  purpose: "EMAIL_VERIFICATION" | "FORGOT_PASSWORD";
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  authMethod?: string;
  requiresStepUp?: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface StepUpResponse {
  accessToken: string;
}

export interface ActiveDeviceSession {
  id: string;
  deviceLabel: string;
  ipTruncated: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  idleExpiresAt: string;
  isCurrentDevice: boolean;
}
