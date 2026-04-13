"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import type { Store } from "@/types/store.types";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  managerType: string;
  userId: string;
}

interface AssignManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStores: Store[];
  onSuccess: () => void;
}

export function AssignManagerModal({
  open,
  onOpenChange,
  selectedStores,
  onSuccess,
}: AssignManagerModalProps) {
  const { accessToken } = useAuth();
  const [managerTypes, setManagerTypes] = useState<string[]>([]);
  const [selectedManagerType, setSelectedManagerType] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available manager types
  useEffect(() => {
    if (open) {
      fetchManagerTypes();
    }
  }, [open]);

  // Fetch team members when manager type is selected
  useEffect(() => {
    if (selectedManagerType) {
      fetchTeamMembers(selectedManagerType);
    } else {
      setTeamMembers([]);
      setSelectedMemberId("");
      setMemberSearch("");
    }
  }, [selectedManagerType]);

  const fetchManagerTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const response = await fetch("/api/teams/manager-types", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setManagerTypes(result.data.managerTypes || []);
      } else {
        toast.error("Failed to load manager types");
      }
    } catch (error) {
      console.error("Error fetching manager types:", error);
      toast.error("Error loading manager types");
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const fetchTeamMembers = async (managerType: string) => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch(
        `/api/teams/members?uniqueKey=${managerType}&status=active`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();

        setTeamMembers(result.data || []);
      } else {
        toast.error("Failed to load team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Error loading team members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Filter team members based on search
  const filteredTeamMembers = teamMembers.filter((member) => {
    if (!memberSearch) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.phone.includes(searchLower)
    );
  });

  const handleSubmit = async () => {
    if (!selectedManagerType) {
      toast.error("Please select a manager type");
      return;
    }

    if (!selectedMemberId) {
      toast.error("Please select a team member");
      return;
    }

    if (selectedStores.length === 0) {
      toast.error("Please select at least one store");
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if any store already has a manager with isStoreUsed = true
      const storeIds = selectedStores.map((s) => s._id);
      const checkResponse = await fetch(
        `/api/brand/stores/assign-manager?storeIds=${storeIds.join(",")}&checkUsed=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        if (checkResult.data && checkResult.data.length > 0) {
          // Some stores already have managers with isStoreUsed = true
          const usedStoreNames = checkResult.data
            .map(
              (assignment: any) => assignment.storeId?.storeName || "Unknown",
            )
            .join(", ");
          toast.error(
            `Cannot assign: The following stores already have assigned managers in use: ${usedStoreNames}`,
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Find selected member
      const selectedMember = teamMembers.find(
        (m) => m._id === selectedMemberId,
      );

      // Prepare assignments data - same member for all selected stores
      const assignments = selectedStores.map((store) => ({
        storeId: store._id,
        teamId: selectedMemberId,
        managerUserId: selectedMember?.userId,
      }));

      const response = await fetch("/api/brand/stores/assign-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ assignments }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to assign managers");
      }

      // Check for errors in the response
      if (result.data && result.data.errors && result.data.errors.length > 0) {
        // Show the first error message
        const firstError = result.data.errors[0];
        if (
          firstError.error.includes("Already assigned") ||
          firstError.error.includes("same uniqueKey")
        ) {
          toast.error(
            "Please remove the assigned manager first before assigning a new one",
          );
        } else {
          toast.error(firstError.error);
        }
        setIsSubmitting(false);
        return;
      }

      // Only show success if there were actually successful assignments
      if (result.data && result.data.created > 0) {
        toast.success(
          `Successfully assigned 1 manager to ${result.data.created} store(s)!`,
        );
      }

      // Reset and close
      handleModalClose(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning managers:", error);
      toast.error(error.message || "Failed to assign managers");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedManagerType("");
      setTeamMembers([]);
      setSelectedMemberId("");
      setMemberSearch("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl! max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Assign Managers to Stores</DialogTitle>
          <DialogDescription>
            Assign team members to {selectedStores.length} selected store(s)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Selected Stores Info */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">
              Selected Stores ({selectedStores.length}):
            </p>
            <div className="max-h-24 overflow-auto text-xs text-muted-foreground">
              {selectedStores.map((store) => (
                <div key={store._id}>• {store.storeName}</div>
              ))}
            </div>
          </div>

          {/* Manager Type Selection */}
          <div className="grid gap-2">
            <Label htmlFor="manager-type">Manager Type</Label>
            <Select
              value={selectedManagerType}
              onValueChange={setSelectedManagerType}
              disabled={isLoadingTypes || isSubmitting}
            >
              <SelectTrigger id="manager-type" className="w-full">
                <SelectValue placeholder="Select manager type" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTypes ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : managerTypes.length > 0 ? (
                  managerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-types" disabled>
                    No manager types found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members Selection */}
          {selectedManagerType && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Team Members</Label>
                {teamMembers.length > 0 && (
                  <Input
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="max-w-xs h-8 text-sm"
                    disabled={isSubmitting}
                  />
                )}
              </div>

              {isLoadingMembers ? (
                <div className="text-center p-8 border rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading members...
                  </p>
                </div>
              ) : memberSearch && filteredTeamMembers.length === 0 ? (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    No members found matching &quot;{memberSearch}&quot;
                  </p>
                </div>
              ) : filteredTeamMembers.length > 0 ? (
                <div className="border rounded-md max-h-64 overflow-auto">
                  <div className="p-2 space-y-2">
                    {filteredTeamMembers.map((member) => (
                      <div
                        key={member._id}
                        className={`flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors ${
                          selectedMemberId === member._id
                            ? "bg-muted border border-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedMemberId(member._id)}
                      >
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary">
                          {selectedMemberId === member._id && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {member.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email} • {member.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    No team members found for this manager type
                  </p>
                </div>
              )}

              {selectedMemberId && (
                <p className="text-xs text-muted-foreground">
                  1 member selected • Will be assigned to{" "}
                  {selectedStores.length} store(s)
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedManagerType ||
              !selectedMemberId ||
              selectedStores.length === 0 ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign 1 Manager to ${selectedStores.length} Store(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
