import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { UseVendorRateReturn } from '@/types/vendor-rate.types';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch vendor rates');
  }

  const data = await res.json();
  return data.data || [];
};

export function useVendorRate(): UseVendorRateReturn {
  const { accessToken } = useAuth();

  const { data, error, mutate } = useSWR(
    accessToken ? ['/api/vendor/rates/get', accessToken] : null,
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
