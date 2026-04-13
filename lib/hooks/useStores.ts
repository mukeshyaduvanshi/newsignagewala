import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import type { Store } from '@/types/store.types';
import { fetchWithRetry } from '@/lib/utils/api-retry';

const fetcher = async (url: string, token: string) => {
  const res = await fetchWithRetry(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch stores');
  }

  const data = await res.json();
  return data.stores || [];
};

export interface UseStoresReturn {
  stores: Store[];
  isLoading: boolean;
  isError: any;
  isSearching: boolean;
  mutate: () => void;
}

export function useStores(searchQuery?: string): UseStoresReturn {
  const { accessToken, user } = useAuth();

  // Only fetch if user is brand
  const isBrand = user?.userType === 'brand';

  // Build URL with search query if provided
  const url = searchQuery 
    ? `/api/brand/stores/get?search=${encodeURIComponent(searchQuery)}`
    : '/api/brand/stores/get';

  const { data, error, mutate, isValidating } = useSWR(
    accessToken && isBrand ? [url, accessToken] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );

  return {
    stores: data || [],
    isLoading: !error && !data,
    isError: error,
    isSearching: isValidating,
    mutate,
  };
}
