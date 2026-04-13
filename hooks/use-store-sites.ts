import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

export interface Site {
  _id: string;
  storeId: string;
  raceeId: string;
  rateId: string;
  elementName: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width: number;
  height: number;
  rate: number;
  photo: string;
  siteDescription?: string;
  createdAt: string;
  approvedAt: string;
  storeName: string;
  storeLocation: {
    latitude: number;
    longitude: number;
  };
}

interface StoreSitesResponse {
  sites: Site[];
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sites");
  }

  return response.json();
};

export function useStoreSites(storeId: string | null) {
  const { accessToken } = useAuth();

  const url = storeId ? `/api/brand/sites/get?storeId=${storeId}` : null;

  const { data, error, isLoading, mutate } = useSWR<StoreSitesResponse>(
    accessToken && url ? [url, accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 3000,
    },
  );

  return {
    sites: data?.sites || [],
    isLoading,
    isError: error,
    mutate,
  };
}
