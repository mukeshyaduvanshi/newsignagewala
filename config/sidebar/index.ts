import { brandSidebarConfig } from "./brand-sidebar.config";
import { vendorSidebarConfig } from "./vendor-sidebar.config";
import { adminSidebarConfig } from "./admin-sidebar.config";
import { managerSidebarConfig } from "./manager-sidebar.config";
import type { SidebarConfig } from "@/types/sidebar.types";

// Central registry for all sidebar configurations
export const sidebarConfigs: Record<string, SidebarConfig> = {
  brand: brandSidebarConfig,
  vendor: vendorSidebarConfig,
  admin: adminSidebarConfig,
  manager: managerSidebarConfig,
};

// Get sidebar config based on userType
export function getSidebarConfig(
  userType: string | null
): SidebarConfig | null {
  if (!userType) return null;
  return sidebarConfigs[userType] || null;
}
