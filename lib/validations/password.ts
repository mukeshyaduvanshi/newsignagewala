import { z } from "zod";

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 special character (@$!%*?&)
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)");

/**
 * Change password validation schema
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
