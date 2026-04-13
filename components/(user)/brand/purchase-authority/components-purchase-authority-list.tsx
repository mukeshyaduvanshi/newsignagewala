"use client";

import { usePurchaseAuthority } from "@/lib/hooks/usePurchaseAuthority";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Loader2, FileText, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { PurchaseAuthorityListProps } from "@/types/purchase-authority.types";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { CardSkeleton } from "@/components/ui/page-loader";
import { useState } from "react";

const ComponentsPurchaseAuthorityList = ({
  onEdit,
}: PurchaseAuthorityListProps) => {
  const { authorities, isLoading, isError, mutate } = usePurchaseAuthority();
  const { accessToken } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      toast.error("No access token found. Please login again.");
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch("/api/brand/purchase-authority/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete purchase authority");
      }

      toast.success("Purchase authority deleted successfully!");
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete purchase authority");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px] p-6">
        <CardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px] flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Purchase Authorities
          </h3>
          <p className="text-sm text-muted-foreground">
            {isError.message || "Failed to load purchase authorities"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px]">
      <div className="bg-muted p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order List
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all purchase orders
            </p>
          </div>
          <Badge variant="secondary">{authorities.length} PO</Badge>
        </div>
      </div>

      <div className="p-6 overflow-y-auto h-[450px]">
        {authorities && authorities.length > 0 ? (
          <div className="space-y-4">
            {authorities.map((authority) => (
              <div
                key={authority._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">
                        PO: {authority.poNumber}
                      </h3>
                      <Badge variant="outline" className="text-xs bg-primary">
                        {authority.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Vendor:</span>
                        <span className="text-sm">
                          {authority.vendorName || "N/A"}
                        </span>
                        {/* {authority.vendorEmail && (
                          <span className="text-xs text-muted-foreground">
                            ({authority.vendorEmail})
                          </span>
                        )} */}
                      </div>
                      <div className="flex gap-4">
                        {/* <div>
                          <span className="text-sm font-medium">Valid: </span>
                          <span className="text-xs">
                            {format(
                              new Date(authority.issueDate),
                              "dd MMM yyyy",
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(authority.expiryDate),
                              "dd MMM yyyy",
                            )}
                          </span>
                        </div> */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Validity:</span>
                          <Badge variant="secondary" className="px-3 py-1">
                            {format(
                              new Date(authority.issueDate),
                              "dd/MM/yyyy",
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(authority.expiryDate),
                              "dd/MM/yyyy",
                            )}
                          </Badge>
                        </div>
                        {/* <div>
                          <span className="text-sm font-medium">Expiry Date: </span>
                          <span className="text-sm">
                            {format(new Date(authority.expiryDate), "dd MMM yyyy")}
                          </span>
                        </div> */}
                      </div>
                      <div>
                        <span className="text-sm font-medium">Amount: </span>
                        <span className="text-lg font-bold text-primary">
                          ₹{authority.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created on{" "}
                      {new Date(authority.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(authority)}
                      disabled={deletingId === authority._id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(authority._id)}
                      disabled={deletingId === authority._id}
                    >
                      {deletingId === authority._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Purchase Authorities Found
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              You haven't created any purchase order authorities yet. Create
              your first one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentsPurchaseAuthorityList;
