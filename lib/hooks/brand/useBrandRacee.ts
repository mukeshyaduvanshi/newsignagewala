/**
 * useBrandRacee — SWR + SSE hook for brand RACEE requests
 * Auto-refetches when an SSE event arrives from /api/brand/racee/sse
 */
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

interface BrandRaceeResponse {
  data: any[];
  message?: string;
}

async function fetcher(
  url: string,
  token: string,
): Promise<BrandRaceeResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch racee data");
  return response.json();
}

export function useBrandRacee(params?: { status?: string; search?: string }) {
  const { accessToken } = useAuth();
  const esRef = useRef<EventSource | null>(null);

  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const queryStr = query.toString();
  const url = `/api/brand/racee${queryStr ? `?${queryStr}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<BrandRaceeResponse>(
    accessToken ? [url, accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  useEffect(() => {
    if (!accessToken) return;

    const sseUrl = `/api/brand/racee/sse?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(sseUrl);
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
    raceeData: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
