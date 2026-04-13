import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { StoreAuthority } from '@/types/store-authority.types';

const fetcher = async (url: string, token: string) => {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Store Authority: Unauthorized access');
        return [];
      }
      throw new Error('Failed to fetch store authorities');
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('Store Authority fetch error:', error);
    return [];
  }
};

export function useStoreAuthority() {
  const { accessToken, user } = useAuth();

  // Only fetch if user is a brand
  const shouldFetch = accessToken && user && user.userType === 'brand';

  const { data, error, mutate } = useSWR<StoreAuthority[]>(
    shouldFetch ? ['/api/brand/store-authority/get', accessToken, user.id] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    authorities: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
