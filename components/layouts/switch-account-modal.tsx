"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";

interface Brand {
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentLogo?: string;
  parentType: string;
  managerType: string;
  uniqueKey: string;
  teamMemberId: string;
}

interface SwitchAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SwitchAccountModal({
  open,
  onOpenChange,
}: SwitchAccountModalProps) {
  const { accessToken, user, updateAuthData } = useAuth();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [switching, setSwitching] = React.useState<string | null>(null);

  // Fetch brands when modal opens
  React.useEffect(() => {
    if (open && accessToken) {
      fetchBrands();
    }
  }, [open, accessToken]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/manager/switch-account/brands", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch brands");
      }

      const result = await response.json();
      setBrands(result.data || []);
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      toast.error(error.message || "Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (parentId: string) => {
    try {
      setSwitching(parentId);
      const response = await fetch("/api/manager/switch-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ parentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to switch account");
      }

      const result = await response.json();

      // Update auth context with new token and user data
      updateAuthData(result.accessToken, result.user);

      toast.success("Account switched successfully!");
      onOpenChange(false);

      // Reload page to refresh all data with new context
      window.location.reload();
    } catch (error: any) {
      console.error("Error switching account:", error);
      toast.error(error.message || "Failed to switch account");
    } finally {
      setSwitching(null);
    }
  };

  const isCurrentBrand = (parentId: string) => {
    return user?.parentId === parentId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Switch Account</DialogTitle>
          <DialogDescription>
            Select the brand/vendor account you want to switch to
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              You are only associated with one brand/vendor
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {brands.map((brand) => {
              const isCurrent = isCurrentBrand(brand.parentId);
              const isSwitching = switching === brand.parentId;

              return (
                <div
                  key={brand.parentId}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={brand.parentLogo || "/avatars/company.png"}
                        alt={brand.parentName}
                      />
                      <AvatarFallback>
                        {brand.parentName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{brand.parentName}</p>
                        <Badge variant="outline" className="text-xs">
                          {brand.parentType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {brand.parentEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your role: {brand.managerType}
                      </p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <Button variant="outline" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      Current
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSwitchAccount(brand.parentId)}
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Switching...
                        </>
                      ) : (
                        "Switch"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
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
