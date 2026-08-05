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
export interface VerifyOtpResponse {
  resetToken: string;
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
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
