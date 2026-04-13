import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import type { Racee } from '@/types/racee.types';
import { fetchWithRetry } from '@/lib/utils/api-retry';

interface UseManagerRaceesResult {
  racees: Racee[];
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export function useManagerRacees(statusFilter: string = 'all'): UseManagerRaceesResult {
  const { accessToken } = useAuth();
  const [racees, setRacees] = useState<Racee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchRacees = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const url = statusFilter === 'all' 
        ? '/api/manager/racee' 
        : `/api/manager/racee?status=${statusFilter}`;

      const response = await fetchWithRetry(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch racees');
      }

      const result = await response.json();
      const raceesData = result.data || [];

      // Map the data to include flat fields for table columns
      const mappedRacees = raceesData.map((racee: Racee) => ({
        ...racee,
        storeName: typeof racee.storeId === 'object' ? racee.storeId.storeName : '',
        storeImage: typeof racee.storeId === 'object' ? racee.storeId.storeImage : '',
        storeAddress: typeof racee.storeId === 'object' ? racee.storeId.storeAddress : '',
        storeCity: typeof racee.storeId === 'object' ? racee.storeId.storeCity : '',
        storeState: typeof racee.storeId === 'object' ? racee.storeId.storeState : '',
        storePincode: typeof racee.storeId === 'object' ? racee.storeId.storePincode : '',
        managerName: typeof racee.teamId === 'object' 
          ? racee.teamId.name 
          : (typeof racee.managerUserId === 'object' ? racee.managerUserId.name : 'Unknown'),
      }));

      setRacees(mappedRacees);
    } catch (error) {
      console.error('Error fetching racees:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsError(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    fetchRacees();
  }, [fetchRacees]);

  return {
    racees,
    isLoading,
    isError,
    mutate: fetchRacees,
  };
}
