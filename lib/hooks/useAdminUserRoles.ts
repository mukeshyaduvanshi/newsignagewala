import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { UserRole, UseUserRolesReturn } from "@/types/user-roles.types";

const fetcher = async (url: string, token: string | null) => {
  if (!token) {
    throw new Error("No access token");
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch");
  }

  const data = await res.json();
  return data.data || [];
};

export function useAdminUserRoles(): UseUserRolesReturn {
  const { accessToken, user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    accessToken && user
      ? ["/api/admin/user-roles/get", accessToken, user.id]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    },
  );

  return {
    authorities: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
