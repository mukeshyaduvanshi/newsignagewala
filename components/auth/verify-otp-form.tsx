"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { LoaderWithText } from "../ui/Loader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState, useEffect } from "react";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "OTP must be exactly 6 digits" })
    .regex(/^\d+$/, { message: "OTP must contain only numbers" }),
});

type OTPFormValues = z.infer<typeof otpSchema>;

export function VerifyOTPForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isResendingPhone, setIsResendingPhone] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [countdownEmail, setCountdownEmail] = useState(0);
  const [countdownPhone, setCountdownPhone] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  const emailForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const phoneForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verifyEmail");
    const storedPhone = sessionStorage.getItem("verifyPhone");
    const isEmailVerified = sessionStorage.getItem("isEmailVerified") === "true";
    const isPhoneVerified = sessionStorage.getItem("isPhoneVerified") === "true";
    
    if (!storedEmail || !storedPhone) {
      toast.error("No email or phone found. Please sign up first.");
      router.push("/auth/signup");
      return;
    }
    
    setEmail(storedEmail);
    setPhone(storedPhone);
    setEmailVerified(isEmailVerified);
    setPhoneVerified(isPhoneVerified);
    setNeedsEmailVerification(!isEmailVerified);
    setNeedsPhoneVerification(!isPhoneVerified);
    
    // Set default active tab to first unverified channel
    if (!isEmailVerified) {
      setActiveTab("email");
    } else if (!isPhoneVerified) {
      setActiveTab("phone");
    }
  }, [router]);

  useEffect(() => {
    if (countdownEmail > 0) {
      const timer = setTimeout(() => setCountdownEmail(countdownEmail - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownEmail]);

  useEffect(() => {
    if (countdownPhone > 0) {
      const timer = setTimeout(() => setCountdownPhone(countdownPhone - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownPhone]);

  const onSubmitEmail = async (data: OTPFormValues) => {
    setIsLoadingEmail(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          otp: data.otp,
          type: "email",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Verification failed");
        return;
      }

      setEmailVerified(true);
      setNeedsEmailVerification(false);
      toast.success(result.message);

      if (result.allVerified) {
        sessionStorage.removeItem("verifyEmail");
        sessionStorage.removeItem("verifyPhone");
        sessionStorage.removeItem("isEmailVerified");
        sessionStorage.removeItem("isPhoneVerified");
        toast.success("All verifications complete! Redirecting...");
        setTimeout(() => router.push("/"), 1000);
      } else if (needsPhoneVerification && !phoneVerified) {
        // Switch to phone tab if it needs verification
        setActiveTab("phone");
        toast.info("Now verify your phone number");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const onSubmitPhone = async (data: OTPFormValues) => {
    setIsLoadingPhone(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: phone,
          otp: data.otp,
          type: "phone",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Verification failed");
        return;
      }

      setPhoneVerified(true);
      setNeedsPhoneVerification(false);
      toast.success(result.message);

      if (result.allVerified) {
        sessionStorage.removeItem("verifyEmail");
        sessionStorage.removeItem("verifyPhone");
        sessionStorage.removeItem("isEmailVerified");
        sessionStorage.removeItem("isPhoneVerified");
        toast.success("All verifications complete! Redirecting...");
        setTimeout(() => router.push("/"), 1000);
      } else if (needsEmailVerification && !emailVerified) {
        // Switch to email tab if it needs verification
        setActiveTab("email");
        toast.info("Now verify your email");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoadingPhone(false);
    }
  };

  const handleResend = async (type: "email" | "phone") => {
    const identifier = type === "email" ? email : phone;
    const setIsResending = type === "email" ? setIsResendingEmail : setIsResendingPhone;
    const setCountdown = type === "email" ? setCountdownEmail : setCountdownPhone;
    const countdown = type === "email" ? countdownEmail : countdownPhone;

    if (countdown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, type }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to resend OTP");
        return;
      }

      toast.success(result.message);
      setCountdown(60);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify Your Account</CardTitle>
          <CardDescription>
            Verify both your email and phone number to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {(needsEmailVerification || needsPhoneVerification) && (
              <TabsList className={cn("grid w-full", needsEmailVerification && needsPhoneVerification ? "grid-cols-2" : "grid-cols-1")}>
                {needsEmailVerification && (
                  <TabsTrigger value="email" disabled={emailVerified}>
                    {emailVerified ? "✓ Email Verified" : "Verify Email"}
                  </TabsTrigger>
                )}
                {needsPhoneVerification && (
                  <TabsTrigger value="phone" disabled={phoneVerified}>
                    {phoneVerified ? "✓ Phone Verified" : "Verify Phone"}
                  </TabsTrigger>
                )}
              </TabsList>
            )}

            {needsEmailVerification && (
            <TabsContent value="email" className="mt-6">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
                  <FieldGroup>
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        We sent a 6-digit code to <strong>{email}</strong>
                      </p>
                    </div>

                    <FormField
                      control={emailForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-center block">Verification code</FormLabel>
                          <FormControl>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={emailVerified}
                              >
                                <InputOTPGroup className="gap-2.5">
                                  <InputOTPSlot index={0} className="rounded-md border" />
                                  <InputOTPSlot index={1} className="rounded-md border" />
                                  <InputOTPSlot index={2} className="rounded-md border" />
                                  <InputOTPSlot index={3} className="rounded-md border" />
                                  <InputOTPSlot index={4} className="rounded-md border" />
                                  <InputOTPSlot index={5} className="rounded-md border" />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Field>
                      <Button type="submit" disabled={isLoadingEmail || emailVerified} className="w-full">
                        {isLoadingEmail ? (
                          <LoaderWithText text="Verifying..." position="left" />
                        ) : emailVerified ? (
                          "Email Verified ✓"
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                    </Field>

                    <Field>
                      <FieldDescription className="text-center">
                        Didn&apos;t receive the code?{" "}
                        <button
                          type="button"
                          onClick={() => handleResend("email")}
                          disabled={countdownEmail > 0 || isResendingEmail || emailVerified}
                          className="underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isResendingEmail
                            ? "Sending..."
                            : countdownEmail > 0
                            ? `Resend in ${countdownEmail}s`
                            : "Resend"}
                        </button>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </Form>
            </TabsContent>
            )}

            {needsPhoneVerification && (
            <TabsContent value="phone" className="mt-6">
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)}>
                  <FieldGroup>
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        We sent a 6-digit code to <strong>{phone}</strong>
                      </p>
                    </div>

                    <FormField
                      control={phoneForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-center block">Verification code</FormLabel>
                          <FormControl>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={phoneVerified}
                              >
                                <InputOTPGroup className="gap-2.5">
                                  <InputOTPSlot index={0} className="rounded-md border" />
                                  <InputOTPSlot index={1} className="rounded-md border" />
                                  <InputOTPSlot index={2} className="rounded-md border" />
                                  <InputOTPSlot index={3} className="rounded-md border" />
                                  <InputOTPSlot index={4} className="rounded-md border" />
                                  <InputOTPSlot index={5} className="rounded-md border" />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Field>
                      <Button type="submit" disabled={isLoadingPhone || phoneVerified} className="w-full">
                        {isLoadingPhone ? (
                          <LoaderWithText text="Verifying..." position="left" />
                        ) : phoneVerified ? (
                          "Phone Verified ✓"
                        ) : (
                          "Verify Phone"
                        )}
                      </Button>
                    </Field>

                    <Field>
                      <FieldDescription className="text-center">
                        Didn&apos;t receive the code?{" "}
                        <button
                          type="button"
                          onClick={() => handleResend("phone")}
                          disabled={countdownPhone > 0 || isResendingPhone || phoneVerified}
                          className="underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isResendingPhone
                            ? "Sending..."
                            : countdownPhone > 0
                            ? `Resend in ${countdownPhone}s`
                            : "Resend"}
                        </button>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </Form>
            </TabsContent>
            )}
          </Tabs>

          <div className="mt-6">
            <FieldDescription className="text-center">
              <a
                href="/auth/signup"
                className="underline underline-offset-4"
                onClick={() => {
                  sessionStorage.removeItem("verifyEmail");
                  sessionStorage.removeItem("verifyPhone");
                }}
              >
                Back to Sign Up
              </a>
            </FieldDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
