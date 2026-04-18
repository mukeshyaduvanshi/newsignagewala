/**
 * useBrandCart — SWR hook for brand cart (cached 30 min on server)
 */
import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

interface BrandCartResponse {
  cart: any;
  message?: string;
}

async function fetcher(url: string, token: string): Promise<BrandCartResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch cart");
  return response.json();
}

export function useBrandCart() {
  const { accessToken } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<BrandCartResponse>(
    accessToken ? ["/api/brand/cart", accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  return {
    cart: data?.cart || null,
    isLoading,
    isError: error,
    mutate,
  };
}
