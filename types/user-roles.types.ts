// User Role types
export interface UserRole {
  _id: string;
  labelName: string;
  uniqueKey: string;
  description: string;
  createdId: string;
  parentId: string;
  isActive: boolean;
  isUsedInTeam: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleEditData {
  _id: string;
  labelName: string;
  description: string;
}

export interface UserRoleFormProps {
  editData: UserRoleEditData | null;
  onCancelEdit: () => void;
}

export interface UserRoleListProps {
  onEdit: (data: UserRoleEditData) => void;
}

export interface UseUserRolesReturn {
  authorities: UserRole[];
  isLoading: boolean;
  isError: any;
  mutate: () => void;
}
