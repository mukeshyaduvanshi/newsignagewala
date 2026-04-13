// Store Authority types
export interface StoreAuthority {
  _id: string;
  selectedOptions: string[];
  uniqueKeys: string[];
  createdId: string;
  parentId: string;
  isActive: boolean;
  isUsedInStore: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreAuthorityEditData {
  _id: string;
  selectedOptions: string[];
}

export interface StoreAuthorityFormProps {
  editData: StoreAuthorityEditData | null;
  onCancelEdit: () => void;
}

export interface StoreAuthorityListProps {
  onEdit: (data: StoreAuthorityEditData) => void;
}
