"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { useState } from "react";
import { LoaderWithText } from "../ui/Loader";
import { toast } from "sonner";
import { VerifyOTPModal } from "./verify-otp-modal";
import { ResetPasswordModal } from "./reset-password-modal";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [resetToken, setResetToken] = useState("");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP");
      }

      setEmailOrPhone(data.emailOrPhone);
      setContactType(result.type);
      setShowOTPModal(true);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
      form.setError("root", {
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (token: string) => {
    setResetToken(token);
    setShowOTPModal(false);
    setShowResetModal(true);
  };

  const handleResetComplete = () => {
    setShowResetModal(false);
    form.reset();
    setEmailOrPhone("");
    setResetToken("");
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn("flex flex-col gap-6", className)}
          {...props}
        >
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Forgot Password</h1>
              <p className="text-muted-foreground text-sm text-balance">
                Enter your email or phone number to receive an OTP
              </p>
            </div>

            {form.formState.errors.root && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/50">
                {form.formState.errors.root.message}
              </div>
            )}

            <FormField
              control={form.control}
              name="emailOrPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com or 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Field>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <LoaderWithText text="Sending OTP..." position="left" />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </Field>

            <Field>
              <FieldDescription className="text-center">
                Remember your password?{" "}
                <a href="/auth/login" className="underline underline-offset-4">
                  Login
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </Form>

      <VerifyOTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
        emailOrPhone={emailOrPhone}
        type={contactType}
      />

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={handleResetComplete}
        resetToken={resetToken}
      />
    </>
  );
}
