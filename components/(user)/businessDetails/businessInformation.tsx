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
import { Upload, FileText, Image as ImageIcon, X } from "lucide-react";
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
import { businessInfoSchema, type BusinessInfoFormValues } from "@/lib/validations/business";

const BusinessInformation = () => {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [profileFileName, setProfileFileName] = useState<string>('');

  if (isLoading) {
    return <PageLoader message="Loading business information..." />;
  }

  if (!user) {
    return <PageLoader message="Redirecting to login..." />;
  }

  const form = useForm<BusinessInfoFormValues>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      companyName: '',
      companyType: '',
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      
      form.setValue('companyLogo', file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('PDF size should be less than 5MB');
        return;
      }
      
      form.setValue('companyProfile', file);
      setProfileFileName(file.name);
    }
  };

  const removeLogo = () => {
    form.setValue('companyLogo', undefined);
    setLogoPreview('');
  };

  const removeProfile = () => {
    form.setValue('companyProfile', undefined);
    setProfileFileName('');
  };

  const onSubmit = async (data: BusinessInfoFormValues) => {
    setIsSubmitting(true);
    try {
      // Create FormData to send files
      const formData = new FormData();
      formData.append('companyName', data.companyName);
      formData.append('companyType', data.companyType);
      
      if (data.companyLogo) {
        formData.append('companyLogo', data.companyLogo);
      }
      
      if (data.companyProfile) {
        formData.append('companyProfile', data.companyProfile);
      }

      // Call API
      const response = await fetch('/api/business/information', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save business information');
      }
      
      toast.success('Business information saved successfully!');
      // Refresh page to show next step (KYC)
      window.location.reload();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save business information');
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
            <div className="flex-1 h-2 bg-muted rounded-full"></div>
            <div className="flex-1 h-2 bg-muted rounded-full"></div>
          </div>
          <p className="text-xs text-muted-foreground">Step 2 of 3</p>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Business Information</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Tell us about your company
          </p>
        </div>

            {/* Company Logo */}
            <FormField
              control={form.control}
              name="companyLogo"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>Company Logo </FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center gap-2">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <div 
                        className="relative w-32 h-32 border-2 border-dashed rounded-2xl overflow-hidden bg-muted/50 cursor-pointer hover:border-primary transition-colors"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        {logoPreview ? (
                          <>
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLogo();
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* <p className="text-xs text-muted-foreground text-center">
                        Click to upload<br/>PNG, JPG up to 2MB
                      </p> */}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Type */}
            <FormField
              control={form.control}
              name="companyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select company type</option>
                      <option value="pvt_ltd">Private Limited</option>
                      <option value="public_ltd">Public Limited</option>
                      <option value="llp">Limited Liability Partnership</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="trust">Trust</option>
                      <option value="society">Society</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Profile PDF */}
            <FormField
              control={form.control}
              name="companyProfile"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>Company Profile</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center gap-3 w-full">
                      {profileFileName && (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 w-full">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[200px]">{profileFileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeProfile}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="w-full">
                        <input
                          type="file"
                          id="profile-upload"
                          accept="application/pdf"
                          onChange={handleProfileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12"
                          onClick={() => document.getElementById('profile-upload')?.click()}
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Upload Profile PDF
                        </Button>
                        {/* <p className="text-xs text-muted-foreground mt-2 text-center">
                          PDF up to 5MB
                        </p> */}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-center">
                    Upload your company profile document
                  </FormDescription>
                  <FormMessage />
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
              <LoaderWithText text="Saving..." position="right" />
            ) : (
              "Save & Continue"
            )}
          </Button>
        </form>
      </Form>
  );
};export default BusinessInformation;