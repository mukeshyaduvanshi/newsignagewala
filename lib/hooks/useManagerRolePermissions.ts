import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { RolePermission } from "@/types/role-permissions.types";

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch role permissions");
  }

  return res.json();
};

export function useManagerRolePermissions() {
  const { accessToken, user } = useAuth();

  // Only fetch if user is manager and has selected a brand (parentId exists)
  const isManager = user?.userType === "manager";
  const hasSelectedBrand = user?.parentId && user?.uniqueKey;

  const { data, error, isLoading, mutate } = useSWR(
    accessToken && isManager && hasSelectedBrand
      ? ["/api/manager/role-permissions", accessToken]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  return {
    authorities: (data?.data || []) as RolePermission[],
    isLoading,
    isError: error,
    mutate,
    hasSelectedBrand: !!hasSelectedBrand,
  };
}
