import {
  Users,
  Store,
  ShoppingCart,
  Briefcase,
  CirclePercent,
  Settings,
  Wrench,
  PackageCheck,
} from "lucide-react";
import { SidebarNavItem, SidebarConfig } from "@/types/sidebar.types";
import { RolePermission } from "@/types/role-permissions.types";

// Module to icon mapping (Add new modules here only if you want custom icons)
// Unmapped modules will use Settings icon by default
const moduleIcons: Record<string, any> = {
  "Rates": CirclePercent,
  "Stores": Store,
  "Campaigns": Briefcase,
  "Orders": ShoppingCart,
  "Team Member": Users,
  "Created Store": Store,
  "Installer": Wrench,
  "Racce": PackageCheck,
};

// Module to URL mapping
const moduleUrls: Record<string, string> = {
  "Rates": "/rates",
  "Stores": "/stores",
  "Campaigns": "/campaigns",
  "Orders": "/orders",
  "Team Member": "/team",
  "Created Store": "/created-stores",
};

// Manager Sidebar Configuration - Dynamic based on Work Authorities
export const managerSidebarConfig: SidebarConfig = {
  getNavigation: (baseUrl, teamAuthorities = [], storeAuthorities = [], rolePermissions: RolePermission[] = []) => {
    const navItems: SidebarNavItem[] = [];

    // If no role permissions, show empty sidebar
    if (!rolePermissions || rolePermissions.length === 0) {
      return navItems;
    }

    // Collect all unique modules where view permission is true (normalized)
    const moduleSet = new Set<string>();
    rolePermissions.forEach((authority) => {
      authority.permissions.forEach((permission) => {
        if (permission.view) {
          moduleSet.add(permission.module.toLowerCase());
        }
      });
    });

    const hasModule = (name: string) => moduleSet.has(name.toLowerCase());

    const hasTeamAddPermission = rolePermissions.some((authority) =>
      authority.permissions.some((permission) => {
        const moduleName = permission.module.toLowerCase();
        return (
          (moduleName === "team member" || moduleName === "team members") &&
          permission.add
        );
      })
    );

    // Filter and sort team authorities (only valid uniqueKey)
    const sortedTeamAuthorities = [...teamAuthorities]
      .filter((auth: any) => auth?.uniqueKey && auth.uniqueKey !== "undefined")
      .sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    // Filter and sort store authorities (only valid items)
    const sortedStoreAuthorities = [...storeAuthorities]
      .filter((authority: any) => authority?.selectedOptions && authority.selectedOptions.length > 0)
      .sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    // Generate store items from store authorities
    const storeItems = sortedStoreAuthorities.flatMap((authority: any) => {
      const uniqueKeys = authority.uniqueKeys || authority.selectedOptions.map((option: string) =>
        option
          .trim()
          .split(/\s+/)
          .map((word: string, index: number) => {
            if (index === 0) {
              return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join("")
      );

      return authority.selectedOptions
        .map((option: string, index: number) => ({
          title: option,
          url: `${baseUrl}/stores/${uniqueKeys[index]}`,
        }))
        .filter((item: { title: string; url: string }) => item.url && !item.url.includes("undefined"));
    });

    // Teams
    if ((hasModule("team member") || hasModule("team members")) && hasTeamAddPermission) {
      const teamItems = sortedTeamAuthorities.map((auth: any) => ({
        title: auth.labelName || auth.uniqueKey,
        url: `${baseUrl}/team/${auth.uniqueKey}`,
      }));

      navItems.push({
        title: "Teams",
        icon: Users,
        url: "#",
        items:
          teamItems.length > 0
            ? teamItems
            : [
                {
                  title: "Teams",
                  url: `${baseUrl}/team`,
                },
              ],
      });
    }

    // Stores
    if (hasModule("stores")) {
      navItems.push({
        title: "Stores",
        icon: Store,
        url: "#",
        items: [
          {
            title: "All Store",
            url: `${baseUrl}/stores`,
          },
          ...storeItems,
        ],
      });
    }

    // Sites (Created-Sites)
    if (hasModule("created-sites") || hasModule("created sites") || hasModule("created store")) {
      navItems.push({
        title: "Sites",
        icon: Store,
        url: "#",
        items: [
          {
            title: "All Sites",
            url: `${baseUrl}/sites`,
          },
        ],
      });
    }

    // Racee
    if (hasModule("racee") || hasModule("racce")) {
      navItems.push({
        title: "Racee",
        icon: CirclePercent,
        url: "#",
        items: [
          {
            title: "Racee",
            url: `${baseUrl}/racee`,
          },
        ],
      });
    }

    // Rates
    if (hasModule("rates")) {
      navItems.push({
        title: "Rates",
        icon: CirclePercent,
        url: "#",
        items: [
          {
            title: "Rate",
            url: `${baseUrl}/rates`,
          },
        ],
      });
    }

    // Orders
    if (hasModule("orders")) {
      navItems.push({
        title: "Orders",
        icon: ShoppingCart,
        url: "#",
        items: [
          {
            title: "Order",
            url: `${baseUrl}/orders`,
          },
        ],
      });
    }

    // Campaigns (if enabled)
    if (hasModule("campaigns")) {
      navItems.push({
        title: "Campaigns",
        icon: Briefcase,
        url: "#",
        items: [
          {
            title: "Campaigns",
            url: `${baseUrl}/campaigns`,
          },
        ],
      });
    }

    return navItems;
  },
};
