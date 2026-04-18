"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { CompanySwitcher } from "@/components/ui/company-switcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/context/AuthContext";
import { useBrandUserRoles } from "@/lib/hooks/useBrandUserRoles";
import { useVendorUserRoles } from "@/lib/hooks/useVendorUserRoles";
import { useAdminUserRoles } from "@/lib/hooks/useAdminUserRoles";
import { useStoreAuthority } from "@/lib/hooks/useStoreAuthority";
import { useManagerRolePermissions } from "@/lib/hooks/useManagerRolePermissions";
import { useManagerUserRoles } from "@/lib/hooks/useManagerUserRoles";
import { getSidebarConfig } from "@/config/sidebar";
import { SidebarNavItem } from "@/types/sidebar.types";
import { LiquidButton } from "../animate-ui/primitives/buttons/liquid";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, accessToken } = useAuth();
  const pathname = usePathname();

  // Conditionally fetch authorities based on userType
  const isBrand = user?.userType === "brand";
  const isVendor = user?.userType === "vendor";
  const isManager = user?.userType === "manager";
  const isAdmin = user?.userType === "admin";

  // Brand: Use brand-specific hooks
  const {
    authorities: brandTeamAuthorities,
    isLoading: brandTeamLoading,
    isError: brandTeamError,
  } = useBrandUserRoles();

  const {
    authorities: brandStoreAuthorities,
    isLoading: brandStoreLoading,
    isError: brandStoreError,
  } = useStoreAuthority();

  // Vendor: Use vendor-specific hooks
  const {
    authorities: vendorTeamAuthorities,
    isLoading: vendorTeamLoading,
    isError: vendorTeamError,
  } = useVendorUserRoles();

  // Admin: Use admin-specific hooks
  const {
    authorities: adminTeamAuthorities,
    isLoading: adminTeamLoading,
    isError: adminTeamError,
  } = useAdminUserRoles();

  // Manager: Use manager-specific hooks
  const {
    authorities: workAuthorities,
    isLoading: workLoading,
    isError: workError,
  } = useManagerRolePermissions();

  const {
    authorities: managerTeamAuthorities,
    isLoading: managerTeamLoading,
    isError: managerTeamError,
  } = useManagerUserRoles();

  // Select the correct authorities based on userType
  const teamAuthorities = isBrand
    ? brandTeamAuthorities
    : isVendor
      ? vendorTeamAuthorities
      : isAdmin
        ? adminTeamAuthorities
        : isManager
          ? managerTeamAuthorities
          : [];
  const storeAuthorities = isBrand ? brandStoreAuthorities : [];
  const teamError = isBrand
    ? brandTeamError
    : isVendor
      ? vendorTeamError
      : isAdmin
        ? adminTeamError
        : isManager
          ? managerTeamError
          : false;
  const storeError = isBrand ? brandStoreError : false;

  // Get sidebar configuration based on userType
  const sidebarConfig = React.useMemo(
    () => getSidebarConfig(user?.userType || null),
    [user?.userType],
  );

  // Generate navigation data
  const navData = React.useMemo(() => {
    if (!sidebarConfig || !user?.userType || !user.adminApproval) return [];

    const baseUrl = `/${user.userType}`;

    // Only pass authorities if they're successfully loaded and no errors
    const safeTeamAuthorities =
      !teamError && Array.isArray(teamAuthorities) ? teamAuthorities : [];
    const safeStoreAuthorities =
      !storeError && Array.isArray(storeAuthorities) ? storeAuthorities : [];
    const safeWorkAuthorities =
      isManager && !workError && Array.isArray(workAuthorities)
        ? workAuthorities
        : [];

    return sidebarConfig.getNavigation(
      baseUrl,
      safeTeamAuthorities,
      safeStoreAuthorities,
      safeWorkAuthorities,
    );
  }, [
    sidebarConfig,
    user?.userType,
    user?.adminApproval,
    teamAuthorities,
    storeAuthorities,
    workAuthorities,
    teamError,
    storeError,
    workError,
    isManager,
    managerTeamLoading,
    managerTeamError,
  ]);

  // Helper function to check if a path is active
  const isActivePath = (url: string) => {
    // Only exact match to avoid parent/child conflicts
    // e.g., /admin/users should NOT be active when on /admin/users/assign-managers
    return pathname === url;
  };
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <CompanySwitcher />
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {navData.map((item: SidebarNavItem) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map(
                      (
                        subItem: { title: string; url: string },
                        index: number,
                      ) => {
                        const isActive = isActivePath(subItem.url);
                        // Use URL + index as key to ensure uniqueness
                        const uniqueKey = `${subItem.url}-${index}`;
                        return (
                          <SidebarMenuItem key={uniqueKey}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={subItem.url}>
                                <LiquidButton
                                  delay={`${0.35}s`}
                                  fillHeight={`${3}px`}
                                  hoverScale={1.05}
                                  tapScale={0.95}
                                  className="text-sm w-full text-left font-medium px-4  h-8 rounded-r-sm overflow-hidden [--liquid-button-color:var(--brand)]  text-foreground "
                                >
                                  {subItem.title}
                                </LiquidButton>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      },
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
