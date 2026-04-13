import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: "brand" | "vendor";
  adminApproval: boolean;
  createdAt: string;
  businessName?: string;
  gstNumber?: string;
}

interface UseUsersParams {
  approvalStatus: string;
  userType: "all" | "brand" | "vendor";
  search: string;
  page: number;
  limit: number;
}

interface UsersResponse {
  users: User[];
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
    throw new Error("Failed to fetch users");
  }

  return response.json();
};

export function useUsers({
  approvalStatus,
  userType,
  search,
  page,
  limit,
}: UseUsersParams) {
  const { accessToken } = useAuth();

  // Build query params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    approvalStatus,
  });

  if (userType !== "all") {
    params.append("userType", userType);
  }

  if (search) {
    params.append("search", search);
  }

  const url = `/api/admin/users?${params.toString()}`;

  // Use SWR for data fetching with revalidation
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
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
