"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Building2, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";

interface Brand {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyLogo: string;
}

interface UserRole {
  _id: string;
  labelName: string;
  uniqueKey: string;
  description: string;
}

interface Manager {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface AssignManagersFormProps {
  onAssignmentSuccess?: () => void;
}

const AssignManagersForm = ({ onAssignmentSuccess }: AssignManagersFormProps = {}) => {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const brandIdFromUrl = searchParams.get('brandId');

  // Brand search states
  const [brandSearch, setBrandSearch] = useState("");
  const [brandResults, setBrandResults] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // User role states
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<UserRole | null>(null);
  const [authorityLoading, setAuthorityLoading] = useState(false);

  // Manager search states
  const [managerSearch, setManagerSearch] = useState("");
  const [managerResults, setManagerResults] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [managerLoading, setManagerLoading] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const managerDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const managerDropdownRef = useRef<HTMLDivElement>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search brands with debounce
  useEffect(() => {
    if (brandDebounceRef.current) {
      clearTimeout(brandDebounceRef.current);
    }

    if (brandSearch.length < 2) {
      setBrandResults([]);
      setShowBrandDropdown(false);
      return;
    }

    if (!accessToken) {
      return;
    }

    brandDebounceRef.current = setTimeout(async () => {
      setBrandLoading(true);
      try {
        const response = await fetch(
          `/api/admin/users/search-brands?search=${encodeURIComponent(brandSearch)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to search brands");

        const data = await response.json();
        setBrandResults(data.data || []);
        setShowBrandDropdown(true);
      } catch (error) {
        console.error("Error searching brands:", error);
        toast.error("Failed to search brands");
      } finally {
        setBrandLoading(false);
      }
    }, 500);
  }, [brandSearch, accessToken]);

  // Fetch user roles when brand is selected
  useEffect(() => {
    if (!selectedBrand) {
      setUserRoles([]);
      setSelectedAuthority(null);
      return;
    }

    if (!accessToken) {
      return;
    }

    const fetchAuthorities = async () => {
      setAuthorityLoading(true);
      try {
        const response = await fetch(
          `/api/admin/user-roles/by-brand?brandId=${selectedBrand._id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user roles");

        const data = await response.json();
        setUserRoles(data.data || []);
      } catch (error) {
        console.error("Error fetching user roles:", error);
        toast.error("Failed to fetch user roles");
      } finally {
        setAuthorityLoading(false);
      }
    };

    fetchAuthorities();
  }, [selectedBrand, accessToken]);

  // Search managers with debounce
  useEffect(() => {
    if (managerDebounceRef.current) {
      clearTimeout(managerDebounceRef.current);
    }

    if (managerSearch.length < 2) {
      setManagerResults([]);
    if (!accessToken) {
      return;
    }

      setShowManagerDropdown(false);
      return;
    }

    managerDebounceRef.current = setTimeout(async () => {
      setManagerLoading(true);
      try {
        const response = await fetch(
          `/api/admin/users/search-managers?search=${encodeURIComponent(managerSearch)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to search managers");

        const data = await response.json();
        setManagerResults(data.data || []);
        setShowManagerDropdown(true);
      } catch (error) {
        console.error("Error searching managers:", error);
        toast.error("Failed to search managers");
      } finally {
        setManagerLoading(false);
      }
    }, 500);
  }, [managerSearch, accessToken]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBrandDropdown(false);
      }
      if (
        managerDropdownRef.current &&
        !managerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowManagerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prefill brand from URL parameter
  useEffect(() => {
    if (!brandIdFromUrl || !accessToken || selectedBrand) {
      return;
    }

    const fetchBrandById = async () => {
      setBrandLoading(true);
      try {
        const response = await fetch(
          `/api/admin/users/${brandIdFromUrl}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch brand details");

        const data = await response.json();
        if (data.user && data.user.userType === "brand") {
          const brand: Brand = {
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            companyName: data.user.businessDetails?.companyName || "",
            companyLogo: data.user.businessDetails?.companyLogo || "",
          };
          setSelectedBrand(brand);
          setBrandSearch(brand.name);
        }
      } catch (error) {
        console.error("Error fetching brand:", error);
        toast.error("Failed to load brand details");
      } finally {
        setBrandLoading(false);
      }
    };

    fetchBrandById();
  }, [brandIdFromUrl, accessToken, selectedBrand]);

  // Handle brand selection
  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setBrandSearch(brand.name);
    setShowBrandDropdown(false);
  };

  // Handle manager selection
  const handleManagerSelect = (manager: Manager) => {
    setSelectedManager(manager);
    setManagerSearch(manager.name);
    setShowManagerDropdown(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBrand) {
      toast.error("Please select a brand");
      return;
    }

    if (!selectedAuthority) {
      toast.error("Please select a user role");
      return;
    }

    if (!selectedManager) {
      toast.error("Please select a manager");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users/assign-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          brandId: selectedBrand._id,
          userRoleId: selectedAuthority._id,
          managerId: selectedManager._id,
          uniqueKey: selectedAuthority.uniqueKey,
          managerType: selectedAuthority.labelName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign manager");
      }

      toast.success("Manager assigned successfully");
      
      // Reset form
      setSelectedBrand(null);
      setBrandSearch("");
      setSelectedAuthority(null);
      setSelectedManager(null);
      setManagerSearch("");
      setUserRoles([]);
      
      // Trigger callback to refresh list
      if (onAssignmentSuccess) {
        onAssignmentSuccess();
      }
    } catch (error: any) {
      console.error("Error assigning manager:", error);
      toast.error(error.message || "Failed to assign manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>Assign Manager to Brand</CardTitle>
        <CardDescription>
          Select a brand, user role, and manager to create an assignment
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Search Input */}
          <div className="space-y-2" ref={brandDropdownRef}>
            <Label htmlFor="brand-search" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Search Brand
            </Label>
            <div className="relative">
              <Input
                id="brand-search"
                type="text"
                placeholder="Search by name, email, or phone..."
                value={brandSearch}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  if (selectedBrand) setSelectedBrand(null);
                }}
                onFocus={() => {
                  if (brandResults.length > 0) setShowBrandDropdown(true);
                }}
                className="pr-10"
              />
              {brandLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!brandLoading && brandSearch && (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              
              {/* Brand Dropdown Results */}
              {showBrandDropdown && brandResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {brandResults.map((brand) => (
                    <div
                      key={brand._id}
                      onClick={() => handleBrandSelect(brand)}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex items-start gap-3 border-b last:border-b-0"
                    >
                      {brand.companyLogo && (
                        <Image
                          src={brand.companyLogo}
                          alt={brand.companyName}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{brand.name}</div>
                        {brand.companyName && (
                          <div className="text-sm text-muted-foreground truncate">
                            {brand.companyName}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {brand.email} • {brand.phone}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Brand Display */}
            {selectedBrand && (
              <div className="mt-2 p-3 bg-accent/50 rounded-md flex items-center gap-3">
                {selectedBrand.companyLogo && (
                  <Image
                    src={selectedBrand.companyLogo}
                    alt={selectedBrand.companyName}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium">{selectedBrand.name}</div>
                  {selectedBrand.companyName && (
                    <div className="text-sm text-muted-foreground">
                      {selectedBrand.companyName}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Select */}
          <div className="space-y-2">
            <Label htmlFor="team-authority" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Role
            </Label>
            {!selectedBrand ? (
              <p className="text-sm text-muted-foreground">
                Please select a brand first
              </p>
            ) : authorityLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading user roles...
              </div>
            ) : userRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No user roles found for this brand
              </p>
            ) : (
              <Select
                value={selectedAuthority?._id || ""}
                onValueChange={(value) => {
                  const authority = userRoles.find((a) => a._id === value);
                  setSelectedAuthority(authority || null);
                }}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((authority) => (
                    <SelectItem key={authority._id} value={authority._id}>
                      <div>
                        <div className="font-medium">{authority.labelName}</div>
                        <div className="text-xs text-muted-foreground">
                          {authority.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Manager Search Input */}
          <div className="space-y-2" ref={managerDropdownRef}>
            <Label htmlFor="manager-search" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Search Manager
            </Label>
            <div className="relative">
              <Input
                id="manager-search"
                type="text"
                placeholder="Search manager by name, email, or phone..."
                value={managerSearch}
                onChange={(e) => {
                  setManagerSearch(e.target.value);
                  if (selectedManager) setSelectedManager(null);
                }}
                onFocus={() => {
                  if (managerResults.length > 0) setShowManagerDropdown(true);
                }}
                className="pr-10"
              />
              {managerLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!managerLoading && managerSearch && (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              
              {/* Manager Dropdown Results */}
              {showManagerDropdown && managerResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {managerResults.map((manager) => (
                    <div
                      key={manager._id}
                      onClick={() => handleManagerSelect(manager)}
                      className="px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{manager.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {manager.email} • {manager.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Manager Display */}
            {selectedManager && (
              <div className="mt-2 p-3 bg-accent/50 rounded-md">
                <div className="font-medium">{selectedManager.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedManager.email} • {selectedManager.phone}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedBrand(null);
                setBrandSearch("");
                setSelectedAuthority(null);
                setSelectedManager(null);
                setManagerSearch("");
                setUserRoles([]);
              }}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Manager"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssignManagersForm;
