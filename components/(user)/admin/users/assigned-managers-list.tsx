"use client";

import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Building2, User, Mail, Phone, Calendar, MoreVertical, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";

interface AssignedManager {
  _id: string;
  manager: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  brand: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    companyLogo: string;
  };
  managerType: string;
  uniqueKey: string;
  status: string;
  createdAt: string;
}

const AssignedManagersList = forwardRef((props, ref) => {
  const { accessToken } = useAuth();
  const [assignments, setAssignments] = useState<AssignedManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAssignments = async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (!accessToken) return;

      const response = await fetch("/api/admin/users/assigned-managers", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data = await response.json();
      setAssignments(data.data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assigned managers", {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refreshList: () => {
      fetchAssignments(true);
    },
  }));

  useEffect(() => {
    if (accessToken) {
      fetchAssignments();
    }
  }, [accessToken]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleToggleStatus = async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setActionLoading(assignmentId);

    try {
      if (!accessToken) return;

      const response = await fetch(`/api/admin/users/assigned-managers/${assignmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          assignmentId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const data = await response.json();
      toast.success(data.message || "Status updated successfully", {
        position: "top-center",
      });

      // Update local state
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId ? { ...a, status: newStatus } : a
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status", {
        position: "top-center",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const performDelete = async (assignmentId: string) => {
    setActionLoading(assignmentId);

    try {
      if (!accessToken) return;

      const response = await fetch(
        `/api/admin/users/assigned-managers/${assignmentId}?id=${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete assignment");

      const data = await response.json();
      toast.success(data.message || "Assignment deleted successfully", {
        position: "top-center",
      });

      // Remove from local state
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment", {
        position: "top-center",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (assignmentId: string) => {
    toast("Are you sure you want to delete this assignment?", {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: () => performDelete(assignmentId),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle>Your Assignments</CardTitle>
          <CardDescription>Managers you have assigned to brands</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Assignments</CardTitle>
            <CardDescription>Managers you have assigned to brands</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAssignments(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No assignments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Assign managers using the form on the left
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Brand Info */}
                <div className="flex items-start gap-3 mb-3 pb-3 border-b">
                  {assignment.brand.companyLogo && (
                    <Image
                      src={assignment.brand.companyLogo}
                      alt={assignment.brand.companyName}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold truncate">
                        {assignment.brand.name}
                      </span>
                    </div>
                    {assignment.brand.companyName && (
                      <p className="text-sm text-muted-foreground truncate">
                        {assignment.brand.companyName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={assignment.status === "active" ? "default" : "secondary"}
                    >
                      {assignment.status}
                    </Badge>
                    <Badge variant="outline">{assignment.managerType}</Badge>
                    
                    {/* Action Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === assignment._id}
                        >
                          {actionLoading === assignment._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(assignment._id, assignment.status)}
                        >
                          {assignment.status === "active" ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Mark Inactive
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Mark Active
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(assignment._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{assignment.manager.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{assignment.manager.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{assignment.manager.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Assigned on {formatDate(assignment.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AssignedManagersList.displayName = "AssignedManagersList";

export default AssignedManagersList;
