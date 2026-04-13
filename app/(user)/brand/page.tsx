"use client";
import ComponentsDashboard from "@/components/(user)/brand/components-dashboard";
import ComponentsUnApprovedUser from "@/components/(user)/unapproved-user";
import { useAuth } from "@/lib/context/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";

const page = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  if (!user) {
    return <PageLoader message="Redirecting to login..." />;
  }

  return (
    <div className="m-4">
      {user.adminApproval ? (
        <ComponentsDashboard />
      ) : (
        <ComponentsUnApprovedUser />
      )}
    </div>
  );
};

export default page;
