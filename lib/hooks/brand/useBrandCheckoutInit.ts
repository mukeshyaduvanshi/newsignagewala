/**
 * useBrandCheckoutInit — BFF hook that fetches purchase authorities + creative managers
 * in a single request, replacing 2 separate useEffect fetches in checkout/page.tsx
 */
import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

interface CheckoutInitData {
  purchaseAuthorities: any[];
  creativeManagers: any[];
}

interface CheckoutInitResponse {
  data: CheckoutInitData;
  message?: string;
}

async function fetcher(
  url: string,
  token: string,
): Promise<CheckoutInitResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch checkout init data");
  return response.json();
}

export function useBrandCheckoutInit() {
  const { accessToken } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<CheckoutInitResponse>(
    accessToken ? ["/api/brand/bff/checkout-init", accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    },
  );

  return {
    purchaseAuthorities: data?.data?.purchaseAuthorities || [],
    creativeManagers: data?.data?.creativeManagers || [],
    isLoading,
    isError: error,
    mutate,
  };
}
