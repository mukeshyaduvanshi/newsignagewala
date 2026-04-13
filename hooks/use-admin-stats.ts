import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

export interface AdminStats {
  allUsersCount: number;
  brandCount: number;
  vendorCount: number;
  adminCount: number;
  managerCount: number;
  storeCount: number;
  siteCount: number;
  raceeCount: number;
}

interface AdminStatsResponse {
  success: boolean;
  data: AdminStats;
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch admin stats");
  }

  return response.json();
};

export function useAdminStats() {
  const { accessToken } = useAuth();

  const url = "/api/admin/users/get";

  // Use SWR for data fetching with revalidation
  const { data, error, isLoading, mutate } = useSWR<AdminStatsResponse>(
    accessToken ? [url, accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // 5 seconds deduping
      refreshInterval: 0, // Refresh every 30 seconds
    },
  );

  return {
    stats: data?.data || {
      allUsersCount: 0,
      brandCount: 0,
      vendorCount: 0,
      adminCount: 0,
      managerCount: 0,
      storeCount: 0,
      siteCount: 0,
      raceeCount: 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}
