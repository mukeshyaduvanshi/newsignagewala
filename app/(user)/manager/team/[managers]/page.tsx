"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useManagerPermissions } from "@/lib/hooks/useManagerPermissions";
import { PageLoader } from "@/components/ui/page-loader";
import ComponentsManagerTeams from "@/modules/brands/teams/components-manager-teams";

export default function ManagerTeamPage() {
  const { user, isLoading: authLoading } = useAuth();
  const permissions = useManagerPermissions("Team Member");

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

  if (!permissions.hasAccess || !permissions.canView) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to view Team Members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ComponentsManagerTeams permissions={permissions} />
    </div>
  );
}
