"use client";

import ComponentsRolePermissionsForm from "@/components/(user)/admin/role-permissions/components-role-permissions-form";
import ComponentsRolePermissionsList from "@/components/(user)/admin/role-permissions/components-role-permissions-list";
import { useState } from "react";
import { RolePermissionEditData } from "@/types/role-permissions.types";

const page = () => {
  const [editData, setEditData] = useState<RolePermissionEditData | null>(null)

  const handleEdit = (data: RolePermissionEditData) => {
    setEditData(data)
  }

  const handleCancelEdit = () => {
    setEditData(null)
  }

  return (
    <div className="m-4 flex flex-col lg:flex-row gap-4">
      <ComponentsRolePermissionsForm editData={editData} onCancelEdit={handleCancelEdit} />
      <ComponentsRolePermissionsList onEdit={handleEdit} />
    </div>
  );
};

export default page;
