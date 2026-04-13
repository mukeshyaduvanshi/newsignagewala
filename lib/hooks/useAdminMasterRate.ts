import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { MasterRate, UseMasterRateReturn } from '@/types/master-rate.types';

const fetcher = async (url: string, token: string | null) => {
  if (!token) {
    throw new Error('No access token');
  }

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }

  const data = await res.json();
  return data.data || [];
};

export function useAdminMasterRate(): UseMasterRateReturn {
  const { accessToken } = useAuth();

  const { data, error, mutate } = useSWR(
    accessToken ? ['/api/admin/rates/get', accessToken] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    }
  );

  return {
    rates: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
