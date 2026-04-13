// Brand Rate types
export interface BrandRate {
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

export interface BrandRateFormData {
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

export interface BrandRateEditData {
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
  canEditDescription: boolean;
  masterRateId?: string;
}

export interface MasterRateSearchResult {
  _id: string;
  labelName: string;
  uniqueKey: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  rate: number;
  imageUrl?: string;
}

export interface UseBrandRateReturn {
  rates: BrandRate[];
  isLoading: boolean;
  isError: any;
  mutate: () => void;
}
