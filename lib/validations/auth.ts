import * as z from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    phone: z.string().regex(/^[0-9]{10}$/, {
      message: "Phone number must be exactly 10 digits.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
    userType: z.enum(["brand", "vendor", "admin"]).refine((val) => val !== undefined, {
      message: "Please select whether you are a Brand or Vendor.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, {
      message: "Email or phone number is required.",
    })
    .refine(
      (value) => {
        // Check if it's a valid email or 10-digit phone number
        const isEmail = z.string().email().safeParse(value).success;
        const isPhone = /^[0-9]{10}$/.test(value);
        return isEmail || isPhone;
      },
      {
        message: "Please enter a valid email address or 10-digit phone number.",
      }
    ),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character.",
    }),
});

export const forgotPasswordSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, {
      message: "Email or phone number is required.",
    })
    .refine(
      (value) => {
        // Check if it's a valid email or 10-digit phone number
        const isEmail = z.string().email().safeParse(value).success;
        const isPhone = /^[0-9]{10}$/.test(value);
        return isEmail || isPhone;
      },
      {
        message: "Please enter a valid email address or 10-digit phone number.",
      }
    ),
});

export const verifyOTPSchema = z.object({
  otp: z.string().length(6, {
    message: "OTP must be exactly 6 digits.",
  }),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type VerifyOTPFormValues = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
