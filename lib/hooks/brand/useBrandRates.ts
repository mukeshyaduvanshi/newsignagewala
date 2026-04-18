/**
 * useBrandRates — SWR hook for brand rates (cached 10 min on server)
 */
import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

interface BrandRatesResponse {
  data: any[];
  message?: string;
}

async function fetcher(
  url: string,
  token: string,
): Promise<BrandRatesResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch rates");
  return response.json();
}

export function useBrandRates() {
  const { accessToken } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<BrandRatesResponse>(
    accessToken ? ["/api/brand/rates/get", accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    },
  );

  return {
    rates: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
