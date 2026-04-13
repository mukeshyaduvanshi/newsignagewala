// Email template types
export interface SendOTPEmailParams {
  to: string;
  name: string;
  otp: string;
}

export interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

export interface SendPasswordResetOTPParams {
  to: string;
  name: string;
  otp: string;
}
