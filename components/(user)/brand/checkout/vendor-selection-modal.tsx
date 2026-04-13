"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Mail, Building2, Search } from "lucide-react";
import { Vendor } from "@/types/order.types";
import { toast } from "sonner";

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVendor: (vendorId: string) => void;
  accessToken: string | null;
  preSelectedVendorId?: string;
}

export function VendorSelectionModal({
  isOpen,
  onClose,
  onSelectVendor,
  accessToken,
  preSelectedVendorId,
}: VendorSelectionModalProps) {
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedVendorId, setSelectedVendorId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Auto-select vendor when modal opens with preSelectedVendorId
  React.useEffect(() => {
    if (isOpen && preSelectedVendorId) {
      setSelectedVendorId(preSelectedVendorId);
    } else if (!isOpen) {
      // Reset selection when modal closes
      setSelectedVendorId("");
      setSearchQuery("");
    }
  }, [isOpen, preSelectedVendorId]);

  React.useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      const debounce = setTimeout(() => {
        fetchVendors();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, isOpen]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const url = searchQuery 
        ? `/api/brand/vendors?search=${encodeURIComponent(searchQuery)}`
        : `/api/brand/vendors`;
      
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
        
        if (data.vendors?.length === 0) {
          toast.info("No vendors found in this area");
        }
      } else {
        toast.error("Failed to fetch vendors");
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Error loading vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedVendorId) {
      toast.error("Please select a vendor");
      return;
    }
    onSelectVendor(selectedVendorId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Vendor</DialogTitle>
          <DialogDescription>
            Search and choose a vendor to fulfill this order
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vendors Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "No vendors found matching your search" : "No approved vendors found"}
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    onClick={() => setSelectedVendorId(vendor._id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedVendorId === vendor._id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(vendor.companyName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-base">
                            {vendor.companyName}
                          </h4>
                          {selectedVendorId === vendor._id && (
                            <Badge variant="default" className="shrink-0">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{vendor.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{vendor.phone}</span>
                          </div>
                          {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {vendor.address}, {vendor.city}, {vendor.state} - {vendor.pincode}
                            </span>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedVendorId}
                className="flex-1"
              >
                Confirm Selection
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
