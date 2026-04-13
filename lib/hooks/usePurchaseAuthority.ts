import useSWR from 'swr';
import { useAuth } from "@/lib/context/AuthContext";
import { PurchaseAuthority } from "@/types/purchase-authority.types";

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch purchase authorities");
  }

  const data = await response.json();
  return data.authorities || [];
};

export function usePurchaseAuthority() {
  const { accessToken, user } = useAuth();

  const { data, error, mutate } = useSWR<PurchaseAuthority[]>(
    accessToken && user ? ['/api/brand/purchase-authority/get', accessToken, user.id] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    authorities: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
