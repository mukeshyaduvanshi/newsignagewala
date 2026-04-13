"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Store } from "@/types";
import { fetchWithRetry } from '@/lib/utils/api-retry';

export interface ManagerDetails {
    companyLogo?: string;
    storeCount: number;
    stores: Store[];
}

export function useBrandViewDetailsManagerStore(managerId?: string) {
  const { accessToken } = useAuth();
  const [managerDetails, setManagerDetails] = useState<ManagerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  

  const fetchManagerDetails = useCallback(async () => {
    if (!accessToken || !managerId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setIsError(false);

      const response = await fetchWithRetry(`/api/teams/manager-details/get?managerId=${managerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setManagerDetails(data.manager || null);
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error("Error fetching manager details:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, managerId]);

  useEffect(() => {
    fetchManagerDetails();
  },[fetchManagerDetails]);

  console.log({managerDetails})

  return {
    managerDetails,
    isLoading,
    isError,
    mutate: fetchManagerDetails,
  }
}
