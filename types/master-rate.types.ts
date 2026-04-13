// Master Rate types
export interface MasterRate {
  _id: string;
  labelName: string;
  uniqueKey: string;
  description: string;
  rate: number;
  measurementUnit: string;
  calculateUnit: string;
  rateType: string;
  width?: number;
  height?: number;
  imageUrl?: string;
  createdId: string;
  parentId: string;
  isActive: boolean;
  isUsedInRates: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MasterRateEditData {
  _id: string;
  labelName: string;
  description: string;
  rate: number;
  measurementUnit: string;
  calculateUnit: string;
  rateType: string;
  width?: number;
  height?: number;
  imageUrl?: string;
}

export interface MasterRateFormProps {
  editData: MasterRateEditData | null;
  onCancelEdit: () => void;
}

export interface MasterRateListProps {
  onEdit: (data: MasterRateEditData) => void;
}

export interface UseMasterRateReturn {
  rates: MasterRate[];
  isLoading: boolean;
  isError: any;
  mutate: () => void;
}
