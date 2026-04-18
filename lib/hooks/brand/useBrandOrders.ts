/**
 * useBrandOrders — SWR + SSE hook for brand orders
 * Auto-refetches when an SSE event arrives from /api/brand/orders/sse
 */
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

interface BrandOrdersResponse {
  orders: any[];
  message?: string;
}

async function fetcher(
  url: string,
  token: string,
): Promise<BrandOrdersResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export function useBrandOrders() {
  const { accessToken } = useAuth();
  const esRef = useRef<EventSource | null>(null);

  const { data, error, isLoading, mutate } = useSWR<BrandOrdersResponse>(
    accessToken ? ["/api/brand/orders", accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  useEffect(() => {
    if (!accessToken) return;

    const url = `/api/brand/orders/sse?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("update", () => {
      mutate();
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [accessToken, mutate]);

  return {
    orders: data?.orders || [],
    isLoading,
    isError: error,
    mutate,
  };
}
