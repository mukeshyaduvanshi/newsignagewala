import useSWR from "swr";
import { useAuth } from "../context/AuthContext";


const fetcher = async (url: string, token: string) => {
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if(!res.ok) {
        throw new Error('Failed to fetch manager rates');
    }

    const data = await res.json();
    return data.data || [];
}

export function useManagerRates() {
  const { accessToken, user } = useAuth();
  
  // Only enable for manager users
  const isManager = user?.userType === 'manager';

  const { data, error, mutate } = useSWR(
    accessToken && isManager ? ["/api/manager/rates", accessToken] : null,
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
  }
}
