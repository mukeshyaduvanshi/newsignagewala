"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { verifyOTPSchema, type VerifyOTPFormValues } from "@/lib/validations/auth";
import { LoaderWithText } from "@/components/ui/Loader";
import { toast } from "sonner";
import { VerifyOTPModalProps } from "@/types/modal.types";

export function VerifyOTPModal({
  isOpen,
  onClose,
  onVerified,
  emailOrPhone,
  type,
}: VerifyOTPModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<VerifyOTPFormValues>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: VerifyOTPFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone,
          otp: data.otp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "OTP verification failed");
      }

      toast.success("OTP verified successfully!");
      onVerified(result.resetToken);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP");
      form.setError("otp", {
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify OTP</DialogTitle>
          <DialogDescription>
            Enter the 6-digit OTP sent to your {type === "email" ? "email" : "phone number"}:{" "}
            <span className="font-semibold">{emailOrPhone}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      {...field}
                      className="text-center text-2xl tracking-widest"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <LoaderWithText text="Verifying..." position="left" />
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
