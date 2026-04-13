"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
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

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  managerType: string;
  userId: string;
  uniqueKey: string;
}

interface ReplaceManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignment: any;
  onSuccess: () => void;
}

export function ReplaceManagerModal({
  open,
  onOpenChange,
  currentAssignment,
  onSuccess,
}: ReplaceManagerModalProps) {
  const { accessToken } = useAuth();
  const [managerTypes, setManagerTypes] = useState<string[]>([]);
  const [selectedManagerType, setSelectedManagerType] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch manager types when modal opens
  useEffect(() => {
    if (open) {
      fetchManagerTypes();
    }
  }, [open]);

  // Auto-select current manager's uniqueKey when manager types are loaded
  useEffect(() => {
    if (managerTypes.length > 0 && currentAssignment?.teamId?.uniqueKey) {
      setSelectedManagerType(currentAssignment.teamId.uniqueKey);
    }
  }, [managerTypes, currentAssignment]);

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
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Filter out current manager
        const filteredMembers = result.data.filter(
          (member: TeamMember) => member._id !== currentAssignment?.teamId?._id
        );
        setTeamMembers(filteredMembers);
      } else {
        toast.error("Failed to load team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
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

    setIsSubmitting(true);

    try {
      const selectedMember = teamMembers.find((m) => m._id === selectedMemberId);
      
      const response = await fetch("/api/brand/stores/assign-manager/replace", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          assignmentId: currentAssignment._id,
          newTeamId: selectedMemberId,
          newManagerUserId: selectedMember?.userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to replace manager");
      }

      toast.success("Manager replaced successfully!");
      handleModalClose(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error replacing manager:", error);
      toast.error(error.message || "Failed to replace manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedMemberId("");
      setMemberSearch("");
      setTeamMembers([]);
      setSelectedManagerType("");
      setManagerTypes([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Replace Manager</DialogTitle>
          <DialogDescription>
            Select a new manager to replace {currentAssignment?.managerUserId?.name || "current manager"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Current Manager Info */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">Current Manager:</p>
            <div className="text-sm">
              <div className="font-semibold">{currentAssignment?.managerUserId?.name}</div>
              <div className="text-xs text-muted-foreground">
                {currentAssignment?.managerUserId?.email}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Role: {currentAssignment?.teamId?.managerType}
              </div>
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
                          selectedMemberId === member._id ? 'bg-muted border border-primary' : ''
                        }`}
                        onClick={() => setSelectedMemberId(member._id)}
                      >
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary">
                          {selectedMemberId === member._id && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.email} • {member.phone}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {member.managerType}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    No other managers found with role: {selectedManagerType}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleModalClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedMemberId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Replacing...
              </>
            ) : (
              "Replace Manager"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
