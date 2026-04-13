"use client";
import useSWR from "swr";
import { useState } from "react";
import { TeamMemberListResponse, TeamMember } from "@/types/team-member.types";
import { fetchWithRetry } from '@/lib/utils/api-retry';

interface UseTeamMembersProps {
  uniqueKey: string;
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "deleted" | "all";
  accessToken?: string;
}

export function useTeamMembers({
  uniqueKey,
  page = 1,
  limit = 20,
  status = "active",
  accessToken,
}: UseTeamMembersProps) {
  const fetcher = async (url: string) => {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch team members");
    }

    return response.json();
  };

  const { data, error, isLoading, mutate } = useSWR<TeamMemberListResponse>(
    accessToken && uniqueKey
      ? `/api/teams/members?uniqueKey=${uniqueKey}&page=${page}&limit=${limit}&status=${status}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    teamMembers: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTeamMemberMutations(accessToken?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTeamMember = async (data: {
    name: string;
    email: string;
    phone: string;
    managerType: string;
    uniqueKey: string;
  }) => {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/teams/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add team member");
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamMember = async (
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ) => {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/members/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update team member");
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamMemberStatus = async (
    id: string,
    status: "active" | "inactive" | "deleted"
  ) => {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/members/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addTeamMember,
    updateTeamMember,
    updateTeamMemberStatus,
    isLoading,
    error,
  };
}
