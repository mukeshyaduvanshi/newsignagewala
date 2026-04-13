"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Brand {
  brandId: string;
  brandName: string;
  brandEmail: string;
  companyLogo: string | null;
  managerType: string;
  teamMemberName: string;
  teamMemberEmail: string;
  teamMemberPhone: string;
  uniqueKey: string;
}

interface BrandSelectionModalProps {
  open: boolean;
  brands: Brand[];
  accessToken: string;
  onBrandSelected: (selectedBrand: Brand) => void;
}

export default function BrandSelectionModal({
  open,
  brands,
  accessToken,
  onBrandSelected,
}: BrandSelectionModalProps) {
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedBrandId) {
      toast.error("Please select a brand");
      return;
    }

    setIsSubmitting(true);

    try {
      
      const response = await fetch("/api/auth/select-brand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ brandId: selectedBrandId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to select brand");
      }

      const selectedBrand = brands.find((b) => b.brandId === selectedBrandId);
      if (selectedBrand) {
        toast.success(`Switched to ${selectedBrand.brandName}`);
        // Pass both selected brand and new access token
        onBrandSelected({
          ...selectedBrand,
          ...data.selectedBrand,
          accessToken: data.accessToken
        });
      }
    } catch (error: any) {
      console.error("Brand selection error:", error);
      toast.error(error.message || "Failed to select brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Select Brand</DialogTitle>
          <DialogDescription>
            You are associated with multiple brands. Please select which brand you want to work with.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedBrandId} onValueChange={setSelectedBrandId}>
            <div className="space-y-3">
              {brands.map((brand) => (
                <div
                  key={brand.brandId}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedBrandId(brand.brandId)}
                >
                  <RadioGroupItem value={brand.brandId} id={brand.brandId} />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={brand.companyLogo || ""} alt={brand.brandName} />
                    <AvatarFallback>{getInitials(brand.brandName)}</AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor={brand.brandId}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="font-medium">{brand.brandName}</div>
                    <div className="text-xs text-muted-foreground">
                      {brand.brandEmail} • {brand.managerType}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBrandId || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Selecting..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
