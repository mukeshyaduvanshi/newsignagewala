import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface Store {
  _id: string;
  storeName: string;
  uniqueKey: string;
  storePhone: string;
  storeAddress: string;
  storeCountry: string;
  storeState: string;
  storeCity: string;
  storePincode: string;
  storeImage?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  createdId: string;
  parentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BrandStoresResponse {
  stores: Store[];
}

const fetcher = async (url: string, token: string) => {
  const response = await fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stores");
  }

  return response.json();
};

export function useBrandStores(searchQuery?: string, limit?: number) {
  const { accessToken } = useAuth();

  // Build URL with query params
  const buildUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    const queryString = params.toString();
    return `/api/brand/stores/get${queryString ? `?${queryString}` : ''}`;
  };

  const url = buildUrl();

  const { data, error, isLoading, mutate } = useSWR<BrandStoresResponse>(
    accessToken ? [url, accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    stores: data?.stores || [],
    isLoading,
    isError: error,
    mutate,
  };
}
