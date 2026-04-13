export interface PurchaseAuthorityFormData {
  _id?: string;
  poNumber: string;
  vendorId: string;
  issueDate: Date;
  expiryDate: Date;
  amount: number;
}

export interface PurchaseAuthority {
  _id: string;
  poNumber: string;
  brandId: string;
  vendorId: string;
  vendorName?: string;
  vendorEmail?: string;
  issueDate: Date;
  expiryDate: Date;
  amount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseAuthorityFormProps {
  editData?: PurchaseAuthorityFormData;
  onCancelEdit: () => void;
}

export interface PurchaseAuthorityListProps {
  onEdit: (data: PurchaseAuthority) => void;
}

export interface Vendor {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
}
