"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoaderWithText } from "../ui/Loader";
import { toast } from "sonner";
import { useAuth, useGuestRoute } from "@/lib/context/AuthContext";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const { login } = useAuth();
  const { isLoading: authLoading } = useGuestRoute(); // Redirect if already logged in
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.emailOrPhone, data.password);
    } catch (error: any) {
      // Check if user needs verification (existing verification flow)
      if (error.message.includes("verify")) {
        router.push("/auth/verify-otp");
        return;
      }
      
      form.setError("root", {
        message: error.message || "Login failed",
      });
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
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email or phone number to login
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <a
                    href="/auth/forgot-password"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <LoaderWithText text="Logging in..." position="left" />
              ) : (
                "Login"
              )}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a href="/auth/signup" className="underline underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}
