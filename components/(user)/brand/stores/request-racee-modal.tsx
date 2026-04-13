"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Store } from "@/types/store.types";

interface Manager {
  _id: string;
  name: string;
  email: string;
  teamMemberId: string;
  managerType: string;
  hasRaceePermission: boolean;
}

interface RequestRaceeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStores: Store[];
  onSuccess?: () => void;
}

export function RequestRaceeModal({
  open,
  onOpenChange,
  selectedStores,
  onSuccess,
}: RequestRaceeModalProps) {
  const { accessToken } = useAuth();
  const [managerTypes, setManagerTypes] = React.useState<string[]>([]);
  const [selectedManagerType, setSelectedManagerType] = React.useState("");
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string>("");
  const [managerSearch, setManagerSearch] = React.useState("");
  const [isLoadingTypes, setIsLoadingTypes] = React.useState(false);
  const [isLoadingManagers, setIsLoadingManagers] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasRaceePermission, setHasRaceePermission] = React.useState(true);
  const [isCheckingPermission, setIsCheckingPermission] = React.useState(false);
  const [isAddingPermission, setIsAddingPermission] = React.useState(false);
  const [addPermissionChecked, setAddPermissionChecked] = React.useState(false);

  // Fetch manager types when modal opens
  React.useEffect(() => {
    if (open) {
      fetchManagerTypes();
    }
  }, [open]);

  // Check permission when manager type is selected
  React.useEffect(() => {
    if (selectedManagerType) {
      checkManagerTypePermission(selectedManagerType);
    } else {
      setManagers([]);
      setSelectedManagerId("");
      setManagerSearch("");
      setHasRaceePermission(true);
      setAddPermissionChecked(false);
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

  const checkManagerTypePermission = async (managerType: string) => {
    setIsCheckingPermission(true);
    try {
      const response = await fetch(`/api/brand/racee/check-permission?managerType=${encodeURIComponent(managerType)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setHasRaceePermission(result.data.hasPermission);
      } else {
        toast.error("Failed to check permissions");
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      toast.error("Error checking permissions");
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedManagerType) return;

    setIsAddingPermission(true);
    try {
      const response = await fetch('/api/brand/racee/add-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ managerType: selectedManagerType }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Racee permission added successfully');
        setHasRaceePermission(true);
        setAddPermissionChecked(false);
      } else {
        toast.error(result.error || 'Failed to add permission');
        setAddPermissionChecked(false);
      }
    } catch (error) {
      console.error('Error adding permission:', error);
      toast.error('Failed to add permission');
      setAddPermissionChecked(false);
    } finally {
      setIsAddingPermission(false);
    }
  };

  // const fetchManagers = async (managerType: string) => {
  //   setIsLoadingManagers(true);
  //   try {
  //     const response = await fetch('/api/brand/racee/managers', {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       const allManagers = result.data || [];
  //       console.log({allManagers});
        
  //       // Filter managers by selected manager type
  //       const filteredByType = allManagers.filter((m: Manager) => 
  //         m.managerType === managerType
  //       );
        
  //       setManagers(filteredByType);
  //     } else {
  //       toast.error("Failed to load managers");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching managers:", error);
  //     toast.error("Error loading managers");
  //   } finally {
  //     setIsLoadingManagers(false);
  //   }
  // };

  // Filter managers based on search
  const filteredManagers = managers.filter((manager) => {
    if (!managerSearch) return true;
    const searchLower = managerSearch.toLowerCase();
    return (
      manager.name.toLowerCase().includes(searchLower) ||
      manager.email.toLowerCase().includes(searchLower)
    );
  });

  const handleManagerChange = (managerId: string) => {
    const manager = managers.find(m => m._id === managerId);
    
    if (!manager?.hasRaceePermission) {
      toast(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Racee Permission Required</p>
          <p className="text-sm">This manager doesn't have Racee permission yet. It will be automatically added when you submit.</p>
        </div>,
        {
          position: 'top-center',
          duration: 4000,
        }
      );
    }
    
    setSelectedManagerId(managerId);
  };

  const handleSubmit = async () => {
    if (!selectedManagerType) {
      toast.error("Please select a manager type");
      return;
    }

    if (selectedStores.length === 0) {
      toast.error("No stores selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/brand/racee/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          storeIds: selectedStores.map(s => s._id),
          managerType: selectedManagerType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Racee requests created successfully');
        if (result.data?.permissionsAdded > 0) {
          toast.info(`Racee permission added to ${result.data.permissionsAdded} manager(s)`);
        }
        handleModalClose(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to create racee requests');
      }
    } catch (error) {
      console.error('Error creating racee requests:', error);
      toast.error('Failed to create racee requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedManagerType("");
      setManagers([]);
      setSelectedManagerId("");
      setManagerSearch("");
      setHasRaceePermission(true);
      setAddPermissionChecked(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Request Racee</DialogTitle>
          <DialogDescription>
            Select a manager to assign racee for {selectedStores.length} selected store(s)
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
              <SelectTrigger id="manager-type">
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

          {/* Permission Checkbox */}
          {selectedManagerType && !hasRaceePermission && !isCheckingPermission && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="add-permission"
                  checked={addPermissionChecked}
                  onChange={(e) => {
                    setAddPermissionChecked(e.target.checked);
                    if (e.target.checked) {
                      handleAddPermission();
                    }
                  }}
                  disabled={isAddingPermission}
                  className="mt-1 h-4 w-4 cursor-pointer"
                />
                <div className="flex-1">
                  <Label htmlFor="add-permission" className="cursor-pointer font-medium text-yellow-900 dark:text-yellow-100">
                    {isAddingPermission ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding Racee permission...
                      </span>
                    ) : (
                      "Add Racee Permission to This Manager Type"
                    )}
                  </Label>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                    This manager type doesn't have Racee permission in Role Permission. Check this box to add it.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isCheckingPermission && selectedManagerType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking permissions...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedManagerType ||
              selectedStores.length === 0 ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Racee Request for ${selectedStores.length} Store(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
