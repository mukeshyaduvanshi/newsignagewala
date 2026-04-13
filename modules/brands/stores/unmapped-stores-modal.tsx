"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import type { Store } from "@/types/store.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/page-loader";

interface UnmappedStoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UnmappedStoresModal({
  open,
  onOpenChange,
  onSuccess,
}: UnmappedStoresModalProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [unmappedStores, setUnmappedStores] = React.useState<Store[]>([]);
  const [activatingStoreId, setActivatingStoreId] = React.useState<
    string | null
  >(null);

  // Fetch unmapped stores when modal opens
  React.useEffect(() => {
    if (open && accessToken) {
      fetchUnmappedStores();
    }
  }, [open, accessToken]);

  const fetchUnmappedStores = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/manager/stores/unmapped", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch unmapped stores");
      }

      const result = await response.json();
      console.log({result});
      
      setUnmappedStores(result.data || []);
    } catch (error: any) {
      console.error("Error fetching unmapped stores:", error);
      toast.error(error.message || "Failed to load unmapped stores");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateStore = async (storeId: string) => {
    try {
      setActivatingStoreId(storeId);
      const response = await fetch("/api/manager/stores/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ storeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to activate store");
      }

      toast.success("Store activated successfully!");

      // Remove the activated store from the list
      setUnmappedStores((prev) =>
        prev.filter((store) => store._id !== storeId)
      );

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal if no more stores
      if (unmappedStores.length === 1) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error activating store:", error);
      toast.error(error.message || "Failed to activate store");
    } finally {
      setActivatingStoreId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unmapped Stores</DialogTitle>
          <DialogDescription>
            These stores match your phone number but are not yet assigned to you.
            Click "Activate" to add them to your store list.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="w-full p-4">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : unmappedStores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No unmapped stores found matching your phone number.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmappedStores.map((store) => (
                  <TableRow key={store._id}>
                    <TableCell className="font-medium">
                      {store.storeName}
                    </TableCell>
                    <TableCell>{store.storePhone}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {store.storeAddress}
                    </TableCell>
                    <TableCell>{store.storeCity}</TableCell>
                    <TableCell>{store.storeState}</TableCell>
                    <TableCell>{store.storePincode}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleActivateStore(store._id)}
                        disabled={activatingStoreId === store._id}
                      >
                        {activatingStoreId === store._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
