import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: "manager";
  adminApproval: boolean;
  createdAt: string;
  businessName?: string;
  gstNumber?: string;
}

interface UseManagersParams {
  approvalStatus: string;
  search: string;
  page: number;
  limit: number;
}

interface ManagersResponse {
  users: Manager[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = async (url: string, token: string) => {
  const response = await fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch managers");
  }

  return response.json();
};

export function useManagers({
  approvalStatus,
  search,
  page,
  limit,
}: UseManagersParams) {
  const { accessToken } = useAuth();

  // Build query params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    approvalStatus,
  });

  if (search) {
    params.append("search", search);
  }

  const url = `/api/admin/users/managers?${params.toString()}`;

  // Use SWR for data fetching with revalidation
  const { data, error, isLoading, mutate } = useSWR<ManagersResponse>(
    accessToken ? [url, accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
