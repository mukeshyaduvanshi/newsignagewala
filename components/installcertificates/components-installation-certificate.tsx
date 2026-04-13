"use client";

import { useInstallationCertificate } from "@/hooks/use-installation-certificate";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  Package,
  Navigation,
  Camera,
  Check,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Ghost,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { UserInfoModal } from "./user-info-modal";
import { MultipleImageCapture } from "./components-multiple-image-capture";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";

const statusColors: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  escalation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const ComponentsInstallationCertificate = () => {
  const params = useParams();
  const id = params?.id as string;
  const { certificate, isLoading, isError, mutate } =
    useInstallationCertificate(id);
  const [sortFilter, setSortFilter] = useState<"default" | "nearLocation">(
    "default",
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  // Check localStorage for user info on component mount
  useEffect(() => {
    const checkUserInfo = () => {
      const userName = localStorage.getItem("installer_name");
      const userPhone = localStorage.getItem("installer_phone");

      if (!userName || !userPhone) {
        setShowUserInfoModal(true);
      }
    };

    checkUserInfo();
  }, []);

  const handleMultipleImageCapture = (site: any) => {
    setSelectedSite(site);
    setCaptureModalOpen(true);
  };

  const handleCaptureComplete = async (imageUrls: string[]) => {
    try {
      const installerName = localStorage.getItem("installer_name");
      const installerPhone = localStorage.getItem("installer_phone");

      if (!installerName || !installerPhone) {
        toast.error("Installer information not found");
        return;
      }

      if (!certificate || !selectedSite) {
        toast.error("Certificate or site information not found");
        return;
      }

      const payload = {
        certificateId: certificate._id,
        siteId: selectedSite.siteId,
        capturedImages: imageUrls,
        installerName,
        installerPhone,
        remarks,
      };

      console.log("Sending payload to API:", payload);
      console.log("Image URLs count:", imageUrls.length);

      const response = await fetch(
        "/api/installcertificates/update-site-images",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      console.log("API Response:", result);

      if (response.ok) {
        toast.success(
          `✓ Site marked as INSTALLED\n${result.data.totalImages} images saved successfully`,
          { duration: 5000 },
        );
        setCaptureModalOpen(false);
        setSelectedSite(null);
        setRemarks("");

        // Refresh the certificate data to hide installed sites
        mutate();
      } else {
        toast.error(result.error || "Failed to save images");
      }
    } catch (error) {
      console.error("Error saving captured images:", error);
      toast.error("Failed to save images. Please try again.");
    }
  };

  const handleUserInfoSubmit = (name: string, phone: string) => {
    localStorage.setItem("installer_name", name);
    localStorage.setItem("installer_phone", phone);
    setShowUserInfoModal(false);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSortFilter("nearLocation");
        setIsLoadingLocation(false);
        toast.success("Location detected successfully");
      },
      (error) => {
        setIsLoadingLocation(false);
        toast.error(
          "Unable to get your location. Please allow location access.",
        );
        console.error("Geolocation error:", error);
      },
    );
  };

  // Group sites by store and calculate distances (only show pending sites)
  const storeGroups = useMemo(() => {
    if (!certificate?.sites) return {};

    // Filter only pending sites
    const pendingSites = certificate.sites.filter(
      (site) => site.status === "pending" || !site.status, // Default to pending if status not set
    );

    if (pendingSites.length === 0) {
      return {}; // No pending sites to show
    }

    const groups = pendingSites.reduce(
      (acc, site) => {
        const storeKey = site.storeId;
        if (!acc[storeKey]) {
          acc[storeKey] = {
            storeName: site.storeName,
            storeLocation: site.storeLocation,
            sites: [],
            distance: 0,
          };
        }
        acc[storeKey].sites.push(site);
        return acc;
      },
      {} as Record<
        string,
        {
          storeName: string;
          storeLocation?: { type: string; coordinates: number[] };
          sites: typeof pendingSites;
          distance: number;
        }
      >,
    );

    // Calculate distances if user location is available and sort by near location is selected
    if (sortFilter === "nearLocation" && userLocation) {
      Object.keys(groups).forEach((storeKey) => {
        const store = groups[storeKey];
        if (store.storeLocation?.coordinates) {
          const [lng, lat] = store.storeLocation.coordinates;
          groups[storeKey].distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            lat,
            lng,
          );
        } else {
          groups[storeKey].distance = Infinity; // Stores without location go to end
        }
      });
    }

    return groups;
  }, [certificate?.sites, sortFilter, userLocation]);

  // Sort store groups based on filter
  const sortedStoreEntries = useMemo(() => {
    const entries = Object.entries(storeGroups);

    if (sortFilter === "nearLocation" && userLocation) {
      return entries.sort((a, b) => a[1].distance - b[1].distance);
    }

    return entries; // Default order
  }, [storeGroups, sortFilter, userLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-16 w-80" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="py-12">
              <p className="text-red-800 dark:text-red-300 text-center text-lg font-medium">
                Failed to load installation certificate. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <UserInfoModal open={showUserInfoModal} onSubmit={handleUserInfoSubmit} />

      <MultipleImageCapture
        open={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        onComplete={handleCaptureComplete}
        siteName={selectedSite?.elementName || ""}
        maxImages={10}
        remarks={remarks}
        setRemarks={setRemarks}
        siteWidth={selectedSite?.width}
        siteHeight={selectedSite?.height}
      />

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl w-[95vw]">
          <div className="relative w-full">
            <img
              src={selectedImage || ""}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  Start Installing - {certificate.orderNumber}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Deadline for installation:{" "}
                  <span className="font-medium">
                    {format(new Date(certificate.deadlineDate), "dd MMM yyyy")}
                  </span>
                </p>
                <p>
                  so far installed{" "}
                  <span className="font-medium">
                    {certificate.sites.length -
                      Object.values(storeGroups).reduce(
                        (total, store) => total + store.sites.length,
                        0,
                      )}{" "}
                    / {certificate.sites.length}
                  </span>{" "}
                  signages
                </p>
              </div>
              {/* </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto"> */}
              <div className="flex gap-2 w-full sm:w-auto flex-row-reverse">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Select
                  value={sortFilter}
                  onValueChange={(value: "default" | "nearLocation") => {
                    if (value === "nearLocation" && !userLocation) {
                      getUserLocation();
                    } else {
                      setSortFilter(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Order</SelectItem>
                    <SelectItem value="nearLocation">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Near My Location
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isLoadingLocation && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Getting location...
                  </span>
                )}
              </div>
            </div>

            {/* All Sites Installed Message */}
            {Object.keys(storeGroups).length === 0 && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">
                      All Sites Installed!
                    </h3>
                    <p className="text-green-700 dark:text-green-400">
                      All {certificate.sites.length} sites have been
                      successfully installed and documented.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sites by Store */}
            {sortedStoreEntries.map(([storeId, storeData]) => (
              <Card key={storeId} className="shadow-sm">
                <CardHeader className="px-1 py-1 ">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex gap-2 items-start  w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-10/12">
                        <CardTitle className="text-base sm:text-lg lg:text-xl wrap-break-words">
                          {storeData.storeName}
                        </CardTitle>
                        {sortFilter === "nearLocation" &&
                          userLocation &&
                          storeData.distance !== Infinity && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] sm:text-xs w-fit"
                            >
                              {storeData.distance.toFixed(2)} km away
                            </Badge>
                          )}
                      </div>
                      <div className="w-2/12flex justify-end">
                        {storeData.storeLocation?.coordinates && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const [lng, lat] =
                                storeData.storeLocation!.coordinates;
                              window.open(
                                `https://www.google.com/maps?q=${lat},${lng}`,
                                "_blank",
                              );
                            }}
                            className="text-xs"
                          >
                            <MapPin className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {viewMode === "list" ? (
                    <div className="overflow-x-auto py-3 sm:py-4">
                      <Table className="min-w-[800px]">
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold whitespace-nowrap text-xs sm:text-sm">
                              S.No
                            </TableHead>
                            <TableHead className="font-semibold whitespace-nowrap text-xs sm:text-sm">
                              Element Name
                            </TableHead>
                            <TableHead className="font-semibold whitespace-nowrap text-xs sm:text-sm">
                              Description
                            </TableHead>
                            <TableHead className="font-semibold text-right whitespace-nowrap text-xs sm:text-sm">
                              Width
                            </TableHead>
                            <TableHead className="font-semibold text-right whitespace-nowrap text-xs sm:text-sm">
                              Height
                            </TableHead>
                            <TableHead className="font-semibold whitespace-nowrap text-xs sm:text-sm">
                              Unit
                            </TableHead>
                            <TableHead className="font-semibold text-right whitespace-nowrap text-xs sm:text-sm">
                              Qty
                            </TableHead>
                            <TableHead className="font-semibold text-right whitespace-nowrap text-xs sm:text-sm">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {storeData.sites.map((site, index) => (
                            <TableRow key={site._id}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                {site.elementName}
                              </TableCell>
                              <TableCell className="max-w-xs text-muted-foreground text-xs sm:text-sm">
                                {site.siteDescription || "-"}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                {site.width}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                {site.height}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {site.measurementUnit}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                {site.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() =>
                                    handleMultipleImageCapture(site)
                                  }
                                  size="sm"
                                  className="text-xs sm:text-sm whitespace-nowrap"
                                >
                                  <Camera className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                                  Capture
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {storeData.sites.map((site, index) => (
                        <Card
                          key={site._id}
                          className="overflow-hidden hover:shadow-lg transition-shadow gap-0 p-0"
                        >
                          {/* Site Image */}
                          {site.photo ? (
                            <div
                              className="relative w-full h-48  overflow-hidden cursor-pointer hover:opacity-90 transition-all bg-gray-100 "
                              onClick={() =>
                                setSelectedImage(site.photo || null)
                              }
                            >
                              <span className="absolute bottom-0 rounded-t left-5 right-5 text-center bg-black/50 text-white text-[10px] px-1 py-0.5 z-10">
                                {site.width} x {site.height}{" "}
                                {site.measurementUnit}
                              </span>

                              <img
                                src={site.photo}
                                alt={site.elementName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 sm:h-48 bg-liner-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                              <div className="text-center">
                                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                <span className="text-xs sm:text-sm text-gray-500">
                                  No Image
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Content Section */}
                          <div className="p-1 ">
                            <div className="space-y-2">
                              <div className="text-center">
                                <h3 className="font-bold text-xs text-primary line-clamp-1">
                                  {site.elementName}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                  {site.siteDescription || "No description"}
                                </p>
                              </div>

                              {/* Site Details
                              <div className="pt-2 border-t space-y-1.5">
                                {site.creativeLink && (
                                  <div className="flex justify-center items-center text-xs sm:text-sm">
                                    <a
                                      href={site.creativeLink}
                                      target="_blank"
                                      rel=" noopener noreferrer"
                                      className="text-blue-600 hover:underline truncate max-w-[150px]"
                                      onMouseOver={() =>
                                        console.log(site.creativeLink)
                                      }
                                    >
                                      Adapted File
                                    </a>
                                  </div>
                                )}
                              </div> */}

                              {/* Captured Images Preview */}
                              {site.capturedImages &&
                                site.capturedImages.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                      Captured Images (
                                      {site.capturedImages.length})
                                    </p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {site.capturedImages
                                        .slice(0, 6)
                                        .map((img: string, idx: number) => (
                                          <div
                                            key={idx}
                                            className="aspect-square rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                            onClick={() =>
                                              setSelectedImage(img)
                                            }
                                          >
                                            <img
                                              src={img}
                                              alt={`Captured ${idx + 1}`}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                        ))}
                                    </div>
                                    {site.capturedImages.length > 6 && (
                                      <p className="text-xs text-center text-muted-foreground mt-1">
                                        +{site.capturedImages.length - 6} more
                                      </p>
                                    )}
                                  </div>
                                )}

                              {/* Installer Info */}
                              {site.installers &&
                                site.installers.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Installers:
                                    </p>
                                    {site.installers.map(
                                      (installer: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-xs text-muted-foreground"
                                        >
                                          <span className="font-medium">
                                            {installer.name}
                                          </span>{" "}
                                          - {installer.phone}
                                          <div className="text-[10px]">
                                            {format(
                                              new Date(installer.capturedAt),
                                              "dd MMM yyyy, HH:mm",
                                            )}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}

                              {/* Action Button */}
                              <Button
                                onClick={() => handleMultipleImageCapture(site)}
                                className="w-full "
                                size="sm"
                                variant="outline"
                              >
                                <Camera className="h-4 w-4" />
                                Capture Images
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ComponentsInstallationCertificate;
