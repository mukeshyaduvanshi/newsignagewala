// Modal component types
export interface VerifyOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (resetToken: string) => void;
  emailOrPhone: string;
  type: "email" | "phone";
}

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetToken: string;
}
