// Vendor Rate types
export interface VendorRate {
  _id: string;
  elementName: string;
  uniqueKey?: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  rate: number;
  instruction?: string;
  imageUrl?: string;
  newElement: boolean;
  masterRateId?: string;
  canEditDescription: boolean;
  createdId: string;
  parentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorRateFormData {
  elementName: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  rate: number;
  instruction?: string;
  imageUrl?: string;
  canEditDescription: boolean;
  masterRateId?: string;
}

export interface VendorRateEditData {
  _id: string;
  elementName: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  rate: number;
  instruction?: string;
  imageUrl?: string;
  canEditDescription: boolean;
  masterRateId?: string;
}

export interface UseVendorRateReturn {
  rates: VendorRate[];
  isLoading: boolean;
  isError: any;
  mutate: () => void;
}

export interface VendorRateSearchResult {
  _id: string;
  elementName: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  imageUrl?: string;
}
