import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';

export interface NewElementRequest {
  _id: string;
  source: 'brand' | 'vendor';
  elementName: string;
  description: string;
  rateType: 'fixed' | 'custom';
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  rate: number;
  instruction?: string;
  imageUrl?: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch new element requests');
  }

  return res.json();
};

export function useNewElementRequests() {
  const { accessToken } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? ['/api/admin/rates/new-elements', accessToken] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    requests: (data?.data || []) as NewElementRequest[],
    isLoading,
    isError: error,
    mutate,
  };
}
