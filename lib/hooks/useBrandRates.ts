"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface BrandRate {
  _id: string;
  elementName: string;
  elementType: string;
  sizeType: 'fixed' | 'custom';
  width?: number;
  height?: number;
  size?: string;
  rate: number;
  brandId: string;
  status: string;
  createdAt: string;
}

interface UseBrandRatesReturn {
  rates: BrandRate[];
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export function useBrandRates(parentId?: string): UseBrandRatesReturn {
  const { accessToken } = useAuth();
  const [rates, setRates] = useState<BrandRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchRates = useCallback(async () => {
    if (!accessToken || !parentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);

      const response = await fetchWithRetry(`/api/brand/rates/get?parentId=${parentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRates(data.rates || []);
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error('Error fetching brand rates:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, parentId]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates,
    isLoading,
    isError,
    mutate: fetchRates,
  };
}
