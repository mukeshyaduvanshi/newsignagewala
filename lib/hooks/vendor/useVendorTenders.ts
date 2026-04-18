/**
 * useVendorTenders — SWR + SSE hook for vendor tenders
 * Auto-refetches when an SSE event arrives from /api/vendor/tenders/sse
 */
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

interface VendorTendersResponse {
  tenders: any[];
  message?: string;
}

async function fetcher(
  url: string,
  token: string,
): Promise<VendorTendersResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch tenders");
  return response.json();
}

export function useVendorTenders() {
  const { accessToken } = useAuth();
  const esRef = useRef<EventSource | null>(null);

  const { data, error, isLoading, mutate } = useSWR<VendorTendersResponse>(
    accessToken ? ["/api/vendor/tenders", accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  useEffect(() => {
    if (!accessToken) return;

    const url = `/api/vendor/tenders/sse?token=${encodeURIComponent(accessToken)}`;
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
    tenders: data?.tenders || [],
    isLoading,
    isError: error,
    mutate,
  };
}
