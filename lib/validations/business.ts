import * as z from "zod";

// Business Information Schema
export const businessInfoSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyType: z.string().min(1, "Please select a company type"),
  companyLogo: z.any().optional(),
  companyProfile: z.any().optional(),
});

export type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

// Business KYC Schema
export const businessKycSchema = z.object({
  hasGST: z.boolean(),
  gstNumber: z.string().min(15, "GST number must be 15 characters").max(15, "GST number must be 15 characters").optional().or(z.literal('')),
  aadharNumber: z.string().length(12, "Aadhar number must be 12 digits").optional().or(z.literal('')),
  cinNumber: z.string().max(21, "CIN number cannot exceed 21 characters").optional().or(z.literal('')),
  msmeNumber: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.hasGST && (!data.gstNumber || data.gstNumber === '')) {
    return false;
  }
  if (!data.hasGST && (!data.aadharNumber || data.aadharNumber === '')) {
    return false;
  }
  return true;
}, {
  message: "Please provide required fields",
  path: ['gstNumber'],
});

export type BusinessKycFormValues = z.infer<typeof businessKycSchema>;
