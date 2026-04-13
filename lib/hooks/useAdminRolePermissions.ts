import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch role permissions');
  }

  const data = await res.json();
  return data.data;
};

export function useAdminRolePermissions() {
  const { accessToken, user } = useAuth();

  const { data, error, mutate } = useSWR(
    accessToken && user ? ['/api/admin/role-permissions/get', accessToken, user.id] : null,
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
