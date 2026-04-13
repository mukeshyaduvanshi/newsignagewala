import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { UseUserRolesReturn } from "@/types/user-roles.types";

const fetcher = async (url: string, token: string | null) => {
  if (!token) {
    console.warn("Manager User Role: No access token available");
    return [];
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Manager User Role: Unauthorized access");
        return [];
      }
      const error = await res.json().catch(() => ({ error: "Failed to fetch" }));
      throw new Error(error.error || "Failed to fetch");
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn("Manager User Role fetch error:", error);
    return [];
  }
};

export function useManagerUserRoles(): UseUserRolesReturn {
  const { accessToken, user } = useAuth();

  const shouldFetch = accessToken && user && user.userType === "manager";

  const { data, error, mutate } = useSWR(
    shouldFetch ? ["/api/manager/teams/authorities", accessToken, user.id] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    }
  );

  return {
    authorities: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
