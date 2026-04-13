import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface Brand {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: "brand";
  adminApproval: boolean;
  createdAt: string;
  businessName?: string;
  gstNumber?: string;
  companyLogo?: string;
  businessDetails?: {
    companyName: string;
    companyLogo: string;
    gstNumber: string;
    cinNumber: string;
    msmeNumber: string;
    billingAddress: string;
  } | null;
}

interface UseBrandsParams {
  approvalStatus: string;
  search: string;
  page: number;
  limit: number;
}

interface BrandsResponse {
  users: Brand[];
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
    throw new Error("Failed to fetch brands");
  }

  return response.json();
};

export function useBrands({
  approvalStatus,
  search,
  page,
  limit,
}: UseBrandsParams) {
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

  const url = `/api/admin/users/brands?${params.toString()}`;

  // Use SWR for data fetching with revalidation
  const { data, error, isLoading, mutate } = useSWR<BrandsResponse>(
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
