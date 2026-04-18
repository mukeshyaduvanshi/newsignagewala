"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useManagerPermissions } from "@/lib/hooks/useManagerPermissions";
import { PageLoader } from "@/components/ui/page-loader";
import ComponentsManagerStores from "@/modules/brands/stores/components-manager-stores";
import ComponentsManagerRates from "@/modules/brands/rates/components-manager-rate";
import ComponentsManagerRacee from "@/modules/brands/racee/components-manager-racee";
import ComponentsManagerCreateSites from "@/modules/brands/create-sites/components-manager-create-sites";
import ComponentsManagerOrders from "@/modules/brands/orders/components-manager-orders";
import ComponentsManagerTeams from "@/modules/brands/teams/components-manager-teams";

export default function ManagerModulePage() {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const module = (params.module as string) || "";

  // Map URL slug to permission module name
  const moduleNameMap: Record<string, string> = {
    stores: "Stores",
    rates: "Rates",
    racee: "Racee",
    campaigns: "Campaigns",
    orders: "Orders",
    team: "Team Member",
    "team-member": "Team Member",
    "team-members": "Team Member",
    "created-sites": "Created-Sites",
    "created-stores": "Created-Sites",
    sites: "Created-Sites",
  };

  const moduleName =
    moduleNameMap[module.toLowerCase()] ||
    module
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  // Get permissions for this module
  const permissions = useManagerPermissions(moduleName);

  if (authLoading) {
    return <PageLoader message="Loading..." />;
  }

  if (!user || user.userType !== "manager") {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-500">Unauthorized - Manager access only</p>
      </div>
    );
  }

  // Check if user has access to this module
  if (permissions.isLoading) {
    return <PageLoader message="Loading permissions..." />;
  }

  if (!permissions.hasSelectedBrand) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            No Brand Selected
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your account is not linked to a brand. Please contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!permissions.hasAccess || !permissions.canView) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to view {moduleName}
          </p>
        </div>
      </div>
    );
  }

  // Render appropriate component based on module
  const renderModule = () => {
    switch (module.toLowerCase()) {
      case "stores":
        return <ComponentsManagerStores permissions={permissions} />;
      case "rates":
        return <ComponentsManagerRates permissions={permissions} />;
      case "racee":
        return <ComponentsManagerRacee permissions={permissions} />;
      case "created-sites":
      case "sites":
        return <ComponentsManagerCreateSites permissions={permissions} />;
      case "campaigns":
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold">Campaigns Module</h2>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        );
      case "orders":
        return <ComponentsManagerOrders permissions={permissions} />;
      case "team":
        // case "team-member":
        // case "team-members":
        return <ComponentsManagerTeams permissions={permissions} />;
      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold">Module Not Found</h2>
            <p className="text-gray-600 mt-2">
              The module "{moduleName}" is not implemented yet
            </p>
          </div>
        );
    }
  };

  return <div className="w-full">{renderModule()}</div>;
}
