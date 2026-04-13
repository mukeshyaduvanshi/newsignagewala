import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { RolePermission } from '@/types/role-permissions.types';

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

export function useBrandRolePermissions() {
  const { accessToken, user } = useAuth();

  // Determine API endpoint based on user type
  const apiEndpoint = user?.userType === 'vendor' 
    ? '/api/vendor/role-permissions/get' 
    : '/api/brand/role-permissions/get';

  const { data, error, mutate } = useSWR<RolePermission[]>(
    accessToken && user ? [apiEndpoint, accessToken, user.id] : null,
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
