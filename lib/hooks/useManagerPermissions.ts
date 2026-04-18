import { useManagerRolePermissions } from "./useManagerRolePermissions";
import { useAuth } from "@/lib/context/AuthContext";
import { Permission } from "@/types/role-permissions.types";

export interface ModulePermissions {
  hasAccess: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canView: boolean;
  canDelete: boolean;
  canBulk: boolean;
  canRequest: boolean;
  isLoading: boolean;
  hasSelectedBrand: boolean;
}

/**
 * Hook to get permissions for a specific module
 * @param moduleName - Name of module (e.g., "Stores", "Rates", "Orders")
 * @returns Permissions object with boolean flags
 */
export function useManagerPermissions(moduleName: string): ModulePermissions {
  const { authorities, isLoading, hasSelectedBrand } =
    useManagerRolePermissions();

  if (isLoading || !authorities || authorities.length === 0) {
    return {
      hasAccess: false,
      canAdd: false,
      canEdit: false,
      canView: false,
      canDelete: false,
      canBulk: false,
      canRequest: false,
      isLoading,
      hasSelectedBrand: hasSelectedBrand ?? false,
    };
  }

  // Find permission for this module across all authorities
  let modulePermission: Permission | undefined;

  for (const authority of authorities) {
    modulePermission = authority.permissions.find(
      (p) => p.module.toLowerCase() === moduleName.toLowerCase(),
    );
    if (modulePermission) break;
  }

  if (!modulePermission) {
    return {
      hasAccess: false,
      canAdd: false,
      canEdit: false,
      canView: false,
      canDelete: false,
      canBulk: false,
      canRequest: false,
      isLoading: false,
      hasSelectedBrand: hasSelectedBrand ?? false,
    };
  }

  return {
    hasAccess: true,
    canAdd: modulePermission.add || false,
    canEdit: modulePermission.edit || false,
    canView: modulePermission.view || false,
    canDelete: modulePermission.delete || false,
    canBulk: modulePermission.bulk || false,
    canRequest: modulePermission.request || false,
    isLoading: false,
    hasSelectedBrand: hasSelectedBrand ?? false,
  };
}
