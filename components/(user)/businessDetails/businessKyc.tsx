'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PageLoader } from "@/components/ui/page-loader";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderWithText } from "@/components/ui/Loader";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { businessKycSchema, type BusinessKycFormValues } from "@/lib/validations/business";

const BusinessKyc = () => {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <PageLoader message="Loading KYC form..." />;
  }

  if (!user) {
    return <PageLoader message="Redirecting to login..." />;
  }

  const form = useForm<BusinessKycFormValues>({
    resolver: zodResolver(businessKycSchema),
    defaultValues: {
      hasGST: true,
      gstNumber: '',
      aadharNumber: '',
      cinNumber: '',
      msmeNumber: '',
    },
  });

  const hasGST = form.watch('hasGST');

  const onSubmit = async (data: BusinessKycFormValues) => {
    setIsSubmitting(true);
    try {
      // Call API
      const response = await fetch('/api/business/kyc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save KYC information');
      }
      
      toast.success('KYC completed successfully!');
      // Redirect to userType specific route
      router.push(result.redirectUrl || '/home');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save KYC information');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Progress Bar */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 w-full max-w-xs">
            <div className="flex-1 h-2 bg-primary rounded-full"></div>
            <div className="flex-1 h-2 bg-primary rounded-full"></div>
            <div className="flex-1 h-2 bg-muted rounded-full"></div>
          </div>
          <p className="text-xs text-muted-foreground">Step 3 of 3</p>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Business KYC</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Complete your business verification
          </p>
        </div>

        

        {/* Conditional Fields */}
        {hasGST ? (
          <>
            {/* GST Number */}
            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="22AAAAA0000A1Z5" 
                      maxLength={15}
                      className="font-mono"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    15-character GST identification number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CIN Number (Optional) */}
            <FormField
              control={form.control}
              name="cinNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CIN Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="L12345AB1234ABC123456" 
                      maxLength={21}
                      className="font-mono"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MSME Number (Optional) */}
            <FormField
              control={form.control}
              name="msmeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MSME Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="UDYAM-XX-00-0000000"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
          </>
          
        ) : (
          /* Aadhar for non-GST */
          <FormField
            control={form.control}
            name="aadharNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aadhar Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123412341234" 
                    maxLength={12}
                    className="font-mono"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                  />
                </FormControl>
                <FormDescription>
                  12-digit Aadhar identification number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {/* GST Status Checkbox */}
        <FormField
          control={form.control}
          name="hasGST"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={!field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(!checked);
                    if (checked) {
                      form.setValue('gstNumber', '');
                    } else {
                      form.setValue('aadharNumber', '');
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I don't have GST registration
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <LoaderWithText text="Submitting..." position="right" />
          ) : (
            "Complete KYC"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default BusinessKyc;