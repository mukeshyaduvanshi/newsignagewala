import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { UseBrandRateReturn } from '@/types/brand-rate.types';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch brand rates');
  }

  const data = await res.json();
  return data.data || [];
};

export function useBrandRate(): UseBrandRateReturn {
  const { accessToken, user } = useAuth();
  
  // Only enable for brand users
  const isBrand = user?.userType === 'brand';

  const { data, error, mutate } = useSWR(
    accessToken && isBrand ? ['/api/brand/rates/get', accessToken] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    rates: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
