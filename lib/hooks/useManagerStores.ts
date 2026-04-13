import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { Store } from '@/types/store.types';

const fetcher = async (url: string, token: string, search: string) => {
  const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${url}${searchParam}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch stores');
  }

  const data = await res.json();
  return data.data;
};

export function useManagerStores(searchQuery: string = '') {
  const { accessToken, user } = useAuth();
  
  // Only enable for manager users
  const isManager = user?.userType === 'manager';
  
  const { data, error, isLoading, mutate } = useSWR<Store[]>(
    accessToken && isManager ? ['/api/manager/stores', accessToken, searchQuery] : null,
    ([url, token, search]: [string, string, string]) => fetcher(url, token, search),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    stores: data || [],
    isLoading,
    isError: error,
    isSearching: isLoading && !!searchQuery,
    mutate,
  };
}
