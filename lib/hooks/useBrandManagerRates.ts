"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface BrandManagerRate {
  _id: string;
  elementName: string;
  uniqueKey: string;
  description: string;
  rateType: 'fixed' | 'custom';
  measurementUnit: string;
  calculateUnit: string;
  rate: number;
  newElement: boolean;
  rateRejected: boolean;
  masterRateId: string;
  canEditDescription: boolean;
  createdId: string;
  parentId: string;
  isActive: boolean;
  isUsedInRates: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseBrandManagerRatesReturn {
  rates: BrandManagerRate[];
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export function useBrandManagerRates(parentId?: string): UseBrandManagerRatesReturn {
  const { accessToken } = useAuth();
  const [rates, setRates] = useState<BrandManagerRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

//   console.log({parentId:parentId});
  

  const fetchRates = useCallback(async () => {
    if (!accessToken || !parentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);

    //   console.log('🔄 Fetching rates from API...');
      
      const response = await fetchWithRetry(`/api/manager/rates/get?parentId=${parentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

    //   console.log('📡 API Response Status:', response.status);

      if (response.ok) {
        const result = await response.json();
        // console.log('📦 API Response Data:', result);
        // console.log('📦 Rates Data:', result.data);
        setRates(result.data || []);
      } else {
        console.error('❌ API Error:', response.status);
        setIsError(true);
      }
    } catch (error) {
      console.error('Error fetching brand manager rates:', error);
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
