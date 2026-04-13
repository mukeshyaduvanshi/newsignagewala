"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

export interface ManagerTeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  uniqueKey: string;
  managerType: string;
  canChangeType: boolean;
  status: "success" | "failed"; // "success" = active, "failed" = inactive
}

interface UseManagerTeamMembersOptions {
  uniqueKey?: string; // optional - if omitted, fetches all members
  status?: string;
  page?: number;
  limit?: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useManagerTeamMembers(options: UseManagerTeamMembersOptions = {}) {
  const { accessToken } = useAuth();
  const { uniqueKey, status = "active", page = 1, limit = 20 } = options;

  const [members, setMembers] = useState<ManagerTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const fetchMembers = useCallback(
    async (
      fetchStatus: string = status,
      fetchPage: number = page,
      search: string = ""
    ) => {
      if (!accessToken) return;

      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(fetchPage),
          limit: String(limit),
          status: fetchStatus,
        });

        if (uniqueKey) params.set("uniqueKey", uniqueKey);
        if (search) params.set("search", search);

        const response = await fetch(
          `/api/manager/teams/members?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch team members");
        }

        const result = await response.json();

        const transformed: ManagerTeamMember[] = result.data.map(
          (m: any) => ({
            id: m._id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            uniqueKey: m.uniqueKey,
            managerType: m.managerType,
            canChangeType: m.canChangeType ?? true,
            status: m.status === "active" ? "success" : "failed",
          })
        );

        setMembers(transformed);
        if (result.pagination) setPagination(result.pagination);
      } catch (error: any) {
        toast.error(error.message || "Failed to load team members");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, uniqueKey, status, page, limit]
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (data: {
    name: string;
    email: string;
    phone: string;
    uniqueKey: string;
    managerType: string;
    sendEmail?: boolean;
  }) => {
    const response = await fetch("/api/manager/teams/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...data, canChangeType: true }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to add member");
    return result;
  };

  const updateMember = async (
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      uniqueKey?: string;
      managerType?: string;
    }
  ) => {
    const response = await fetch(`/api/manager/teams/members/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to update member");
    return result;
  };

  const toggleStatus = async (id: string, newStatus: "active" | "inactive") => {
    const response = await fetch(`/api/manager/teams/members/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to update status");
    return result;
  };

  const removeMember = async (id: string) => {
    const response = await fetch(`/api/manager/teams/members/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to remove member");
    return result;
  };

  return {
    members,
    loading,
    pagination,
    fetchMembers,
    addMember,
    updateMember,
    toggleStatus,
    removeMember,
    setMembers,
    setPagination,
  };
}
