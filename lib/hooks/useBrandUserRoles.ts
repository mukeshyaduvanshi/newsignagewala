import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole, UseUserRolesReturn } from '@/types/user-roles.types';

const fetcher = async (url: string, token: string | null) => {
  if (!token) {
    console.warn('User Role: No access token available');
    return [];
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('User Role: Unauthorized access');
        return [];
      }
      const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
      throw new Error(error.error || 'Failed to fetch');
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('User Role fetch error:', error);
    return [];
  }
};

export function useBrandUserRoles(): UseUserRolesReturn {
  const { accessToken, user } = useAuth();

  // Only fetch if user is a brand
  const shouldFetch = accessToken && user && user.userType === 'brand';

  const { data, error, mutate } = useSWR(
    shouldFetch ? ['/api/brand/user-roles/get', accessToken, user.id] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    }
  );

  return {
    authorities: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
