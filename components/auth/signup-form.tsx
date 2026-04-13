"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { LoaderWithText } from "../ui/Loader";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useEffect } from "react";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth, useGuestRoute } from "@/lib/context/AuthContext";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const { signup } = useAuth();
  const { isLoading: authLoading } = useGuestRoute(); // Redirect if already logged in
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [phoneOTPSent, setPhoneOTPSent] = useState(false);
  const [emailOTPVerified, setEmailOTPVerified] = useState(false);
  const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [isEmailOTPLoading, setIsEmailOTPLoading] = useState(false);
  const [isPhoneOTPLoading, setIsPhoneOTPLoading] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: undefined,
    },
  });

  const watchedEmail = form.watch("email");
  const watchedPhone = form.watch("phone");
  const watchedName = form.watch("name");
  const watchedPassword = form.watch("password");

  // Check if user is entering admin credentials - ALL must match
  useEffect(() => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mukeshyaduvanshi1508@gmail.com";
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || "7827095778";
    const adminName = process.env.NEXT_PUBLIC_ADMIN_NAME || "Mukesh Yaduvanshi";
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Mukesh@150802";
    
    // ALL credentials must match for admin detection
    if (
      watchedEmail?.toLowerCase() === adminEmail.toLowerCase() &&
      watchedPhone === adminPhone &&
      watchedName?.toLowerCase() === adminName.toLowerCase() &&
      watchedPassword === adminPassword
    ) {
      setIsAdmin(true);
      form.setValue("userType", "admin");
    } else {
      setIsAdmin(false);
      // Only reset userType if it was set to admin
      if (form.getValues("userType") === "admin") {
        form.resetField("userType");
      }
    }
  }, [watchedEmail, watchedPhone, watchedName, watchedPassword]);

  // Countdown timers
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  // Remove auto-send OTP - user will manually click verify buttons

  const sendEmailOTP = async (email: string) => {
    if (emailCountdown > 0) return;
    
    setIsEmailOTPLoading(true);
    try {
      // First check if email already exists
      const checkResponse = await fetch("/api/auth/check-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, type: "email" }),
      });

      const checkResult = await checkResponse.json();
      
      if (checkResult.exists) {
        toast.error("This email is already registered. Please use a different email or login.");
        setIsEmailOTPLoading(false);
        return;
      }

      // If email doesn't exist, send OTP
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, type: "email" }),
      });

      const result = await response.json();
      // console.log("Email OTP send result:", result);
      
      if (response.ok) {
        setEmailOTPSent(true);
        setEmailCountdown(60);
        toast.success("OTP sent to your email!");
      } else {
        toast.error(result.message || "Failed to send email OTP");
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      toast.error("Error sending email OTP");
    } finally {
      setIsEmailOTPLoading(false);
    }
  };

  const sendPhoneOTP = async (phone: string) => {
    if (phoneCountdown > 0) return;
    
    setIsPhoneOTPLoading(true);
    try {
      // First check if phone already exists
      const checkResponse = await fetch("/api/auth/check-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, type: "phone" }),
      });

      const checkResult = await checkResponse.json();
      
      if (checkResult.exists) {
        toast.error("This phone number is already registered. Please use a different number or login.");
        setIsPhoneOTPLoading(false);
        return;
      }

      // If phone doesn't exist, send OTP
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, type: "phone" }),
      });

      const result = await response.json();
      // console.log("Phone OTP send result:", result);
      
      if (response.ok) {
        setPhoneOTPSent(true);
        setPhoneCountdown(60);
        toast.success("OTP sent to your phone!");
      } else {
        toast.error(result.message || "Failed to send phone OTP");
      }
    } catch (error) {
      console.error("Error sending phone OTP:", error);
      toast.error("Error sending phone OTP");
    } finally {
      setIsPhoneOTPLoading(false);
    }
  };

  const verifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    try {
      // console.log("Verifying email OTP:", { identifier: watchedEmail, otp: emailOTP, type: "email" });
      
      const response = await fetch("/api/auth/verify-otp-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: watchedEmail,
          otp: emailOTP,
          type: "email"
        }),
      });

      const result = await response.json();
      // console.log("Email OTP verification result:", result);
      
      if (response.ok) {
        setEmailOTPVerified(true);
        toast.success("Email verified!");
      } else {
        console.error("Email OTP verification failed:", result);
        toast.error(result.message || "Invalid OTP");
        if (result.debug) {
          // console.log("Debug info:", result.debug);
        }
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      toast.error("Error verifying email OTP");
    }
  };

  const verifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    try {
      // console.log("Verifying phone OTP:", { identifier: watchedPhone, otp: phoneOTP, type: "phone" });
      
      const response = await fetch("/api/auth/verify-otp-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: watchedPhone,
          otp: phoneOTP,
          type: "phone"
        }),
      });

      const result = await response.json();
      // console.log("Phone OTP verification result:", result);
      
      if (response.ok) {
        setPhoneOTPVerified(true);
        toast.success("Phone verified!");
      } else {
        console.error("Phone OTP verification failed:", result);
        toast.error(result.message || "Invalid OTP");
        if (result.debug) {
          // console.log("Debug info:", result.debug);
        }
      }
    } catch (error) {
      console.error("Error verifying phone OTP:", error);
      toast.error("Error verifying phone OTP");
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    if (!emailOTPVerified || !phoneOTPVerified) {
      toast.error("Please verify both email and phone first!");
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        ...data,
        isEmailVerified: true,
        isPhoneVerified: true
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoaderWithText text="Loading..." position="right" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Fill in the form below to create your account
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input 
                        placeholder="1234567890" 
                        maxLength={10} 
                        disabled={phoneOTPVerified}
                        {...field} 
                      />
                      {phoneOTPVerified && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    {/* Verify Phone Button - Only show if phone is valid and OTP not sent */}
                    {watchedPhone && /^[0-9]{10}$/.test(watchedPhone) && !phoneOTPSent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => sendPhoneOTP(watchedPhone)}
                        disabled={isPhoneOTPLoading}
                        className="w-full"
                      >
                        {isPhoneOTPLoading ? (
                          <LoaderWithText text="Sending..." position="right" />
                        ) : (
                          "Verify Phone"
                        )}
                      </Button>
                    )}
                    
                    {phoneOTPSent && !phoneOTPVerified && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <InputOTP
                            maxLength={6}
                            value={phoneOTP}
                            onChange={setPhoneOTP}
                          >
                            <InputOTPGroup className="gap-1">
                              <InputOTPSlot index={0} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={1} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={2} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={3} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={4} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={5} className="rounded-md border h-8 w-8" />
                            </InputOTPGroup>
                          </InputOTP>
                          <Button
                            type="button"
                            size="sm"
                            onClick={verifyPhoneOTP}
                            disabled={phoneOTP.length !== 6}
                          >
                            Verify
                          </Button>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Enter OTP sent to your phone</span>
                          <button
                            type="button"
                            onClick={() => sendPhoneOTP(watchedPhone)}
                            disabled={phoneCountdown > 0}
                            className="underline hover:no-underline disabled:opacity-50"
                          >
                            {phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : "Resend"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input 
                        type="email" 
                        placeholder="m@example.com" 
                        disabled={emailOTPVerified}
                        {...field} 
                      />
                      {emailOTPVerified && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    {/* Verify Email Button - Only show if email is valid and OTP not sent */}
                    {watchedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail) && !emailOTPSent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => sendEmailOTP(watchedEmail)}
                        disabled={isEmailOTPLoading}
                        className="w-full"
                      >
                        {isEmailOTPLoading ? (
                          <LoaderWithText text="Sending..." position="right" />
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                    )}
                    
                    {emailOTPSent && !emailOTPVerified && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <InputOTP
                            maxLength={6}
                            value={emailOTP}
                            onChange={setEmailOTP}
                          >
                            <InputOTPGroup className="gap-1">
                              <InputOTPSlot index={0} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={1} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={2} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={3} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={4} className="rounded-md border h-8 w-8" />
                              <InputOTPSlot index={5} className="rounded-md border h-8 w-8" />
                            </InputOTPGroup>
                          </InputOTP>
                          <Button
                            type="button"
                            size="sm"
                            onClick={verifyEmailOTP}
                            disabled={emailOTP.length !== 6}
                          >
                            Verify
                          </Button>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Enter OTP sent to your email</span>
                          <button
                            type="button"
                            onClick={() => sendEmailOTP(watchedEmail)}
                            disabled={emailCountdown > 0}
                            className="underline hover:no-underline disabled:opacity-50"
                          >
                            {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : "Resend"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  Must be at least 8 characters long.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>Please confirm your password.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Working with us?</FormLabel>
                <FormControl>
                  {isAdmin ? (
                    <div className="rounded-lg border border-purple-500 bg-purple-50 dark:bg-purple-950/20 p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                          Admin Account Detected
                        </p>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                        You'll be registered as an administrator with full system access.
                      </p>
                    </div>
                  ) : (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-8 items-center"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="brand" id="brand" />
                        <Label htmlFor="brand">Brand</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vendor" id="vendor" />
                        <Label htmlFor="vendor">Vendor</Label>
                      </div>
                    </RadioGroup>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button 
              type="submit" 
              disabled={isLoading || !emailOTPVerified || !phoneOTPVerified} 
              className="w-full"
            >
              {isLoading ? (
                <LoaderWithText text="Creating Account..." position="right" />
              ) : (
                "Create Account"
              )}
            </Button>
            {(!emailOTPVerified || !phoneOTPVerified) && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Please verify your email and phone to continue
              </p>
            )}
          </Field>

          <Field>
            <FieldDescription className="px-6 text-center">
              Already have an account?{" "}
              <a href="/auth/login" className="underline underline-offset-4">
                Sign in
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}