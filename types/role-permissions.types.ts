// Role Permission types
export interface Permission {
  module: string;
  add: boolean;
  edit: boolean;
  view: boolean;
  delete: boolean;
  bulk: boolean;
  request: boolean;
}

export interface RolePermission {
  _id: string;
  teamMemberId: string;
  teamMemberName: string;
  teamMemberUniqueKey: string;
  permissions: Permission[];
  createdId: string;
  parentId: string;
  isActive: boolean;
  isUsedInWork: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermissionEditData {
  _id: string;
  teamMemberId: string;
  teamMemberName: string;
  teamMemberUniqueKey: string;
  permissions: Permission[];
}

export interface RolePermissionFormProps {
  editData: RolePermissionEditData | null;
  onCancelEdit: () => void;
}

export interface RolePermissionListProps {
  onEdit: (data: RolePermissionEditData) => void;
}
