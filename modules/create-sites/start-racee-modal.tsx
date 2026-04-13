"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/context/AuthContext";
import {
  useBrandManagerRates,
  type BrandManagerRate,
} from "@/lib/hooks/useBrandManagerRates";
import { LocationCapture } from "./location-capture";
import { CameraView } from "@/components/ui/camera-view";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";

// Dynamically import ImageEditor to avoid SSR issues with Fabric.js
// Update the import path below if your ImageEditor component is in a different location
const ImageEditor = dynamic(
  () => import("@/components/ui/image-editor").then((mod) => mod.ImageEditor),
  { ssr: false },
);
// If the file does not exist, create it at src/components/ui/image-editor.tsx and export ImageEditor from it.

interface StartRaceeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raceeId: string;
  storeId: string;
  parentId: string;
  storeDetails: any;
  onSuccess: () => void;
}

export function StartRaceeModal({
  open,
  onOpenChange,
  raceeId,
  storeId,
  parentId,
  storeDetails,
  onSuccess,
}: StartRaceeModalProps) {
  const { accessToken } = useAuth();
  const { rates, isLoading: ratesLoading } = useBrandManagerRates(parentId);
  // const storeName = useStores(storeId);

  // console.log(storeDetails.storeName);

  //   console.log('🎯 Modal - Rates from Hook:', {
  //     ratesCount: rates.length,
  //     rates: rates,
  //     isLoading: ratesLoading,
  //     parentId: parentId
  //   });

  const [selectedRateId, setSelectedRateId] = React.useState<string>("");
  const [selectedRate, setSelectedRate] =
    React.useState<BrandManagerRate | null>(null);
  const [siteDescription, setSiteDescription] = React.useState<string>("");
  const [width, setWidth] = React.useState<string>("");
  const [height, setHeight] = React.useState<string>("");
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string>("");
  const [showCamera, setShowCamera] = React.useState(false);
  const [showEditor, setShowEditor] = React.useState(false);
  const [editedImageUrl, setEditedImageUrl] = React.useState<string>("");
  const [location, setLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rectInfo, setRectInfo] = React.useState<
    | {
        x: number;
        y: number;
        width: number;
        height: number;
        videoWidth: number;
        videoHeight: number;
        originalWidth: number;
        originalHeight: number;
      }
    | undefined
  >(undefined);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedRateId) {
      const rate = rates.find((r) => r._id === selectedRateId);
      setSelectedRate(rate || null);

      // For fixed rate type, you might want to set default dimensions
      if (rate?.rateType === "fixed") {
        // Set width and height if available from rate or leave empty for user input
        setWidth("");
        setHeight("");
      } else {
        setWidth("");
        setHeight("");
      }
    }
  }, [selectedRateId, rates]);

  const handleCameraCapture = (
    imageSrc: string,
    capturedRectInfo?: {
      x: number;
      y: number;
      width: number;
      height: number;
      videoWidth: number;
      videoHeight: number;
      originalWidth: number;
      originalHeight: number;
    },
  ) => {
    setPhotoPreview(imageSrc);
    setEditedImageUrl(imageSrc);
    setRectInfo(capturedRectInfo);
    setShowCamera(false);
    setShowEditor(true); // Open editor automatically
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        setEditedImageUrl(dataUrl);
        setRectInfo(undefined); // Clear rect info for uploaded photos
        setShowEditor(true); // Open editor automatically
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditedImage = async (editedBlob: Blob) => {
    // Convert blob to File
    const file = new File([editedBlob], "edited-image.png", {
      type: "image/png",
    });
    setPhoto(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(editedBlob);
    setPhotoPreview(previewUrl);
    setShowEditor(false);
    toast.success("Image edited successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRate) {
      toast.error("Please select a rate");
      return;
    }

    if (selectedRate.rateType === "custom" && (!width || !height)) {
      toast.error("Please enter width and height");
      return;
    }

    if (!photo) {
      toast.error("Please capture a photo");
      return;
    }

    // if (!location) {
    //   toast.error('Please capture location');
    //   return;
    // }

    setIsSubmitting(true);

    try {
      // Upload photo first
      const formData = new FormData();
      formData.append("file", photo);

      const uploadResponse = await fetch("/api/brand/stores/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload photo");
      }

      const { url: photoUrl } = await uploadResponse.json();

      // Create site data
      const siteData = {
        raceeId,
        site: {
          rateId: selectedRate._id,
          elementName: selectedRate.elementName,
          uniqueKey: selectedRate.uniqueKey,
          description: selectedRate.description,
          siteDescription: siteDescription,
          rateType: selectedRate.rateType,
          measurementUnit: selectedRate.measurementUnit,
          calculateUnit: selectedRate.calculateUnit,
          width: Number(width),
          height: Number(height),
          rate: selectedRate.rate,
          photo: photoUrl,
          //   location: {
          //     type: 'Point',
          //     coordinates: [location.longitude, location.latitude],
          //   },
          createdAt: new Date().toISOString(),
        },
      };

      const response = await fetch("/api/manager/racee/add-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(siteData),
      });

      if (response.ok) {
        toast.success("Site added successfully");
        onSuccess();
        onOpenChange(false);
        // Reset form
        setSelectedRateId("");
        setSelectedRate(null);
        setSiteDescription("");
        setWidth("");
        setHeight("");
        setPhoto(null);
        setPhotoPreview("");
        setLocation(null);
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to add site");
      }
    } catch (error) {
      console.error("Error adding site:", error);
      toast.error("Failed to add site");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && !showEditor && !showCamera}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add New Site for{" "}
              <span className="font-semibold text-brand">
                {storeDetails?.storeName}
              </span>{" "}
              Store
            </DialogTitle>
            <DialogDescription>
              Select an element you wish to use for the site
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rate Details */}
            {selectedRate && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                <h3 className="font-semibold">Rate Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Element:</span>{" "}
                    {selectedRate.elementName}
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>{" "}
                    {selectedRate.rateType}
                  </div>
                  <div>
                    <span className="text-gray-600">Unit:</span>{" "}
                    {selectedRate.measurementUnit}
                  </div>
                  <div>
                    <span className="text-gray-600">Rate:</span> ₹
                    {selectedRate.rate}/{selectedRate.calculateUnit}
                  </div>
                  {selectedRate.description && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Description:</span>{" "}
                      {selectedRate.description}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Rate Selection */}
            <div className="space-y-2">
              <Label htmlFor="rate">
                Select Element <span className="text-red-600">*</span>
              </Label>
              {ratesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading rates...
                </div>
              ) : (
                <Select
                  value={selectedRateId}
                  onValueChange={setSelectedRateId}
                >
                  <SelectTrigger id="rate" className="w-full">
                    <SelectValue placeholder="Select a rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {rates.map((rate) => (
                      <SelectItem key={rate._id} value={rate._id}>
                        {rate.elementName} ({rate.rateType}) -{" "}
                        {rate.measurementUnit} - ₹{rate.rate}/
                        {rate.calculateUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Site Description */}
            {selectedRate && (
              <div className="space-y-2">
                <Label htmlFor="siteDescription">
                  Site Description <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="siteDescription"
                  type="text"
                  placeholder="Enter details like facia / counter / left wall / right wall..."
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                />
              </div>
            )}

            {/* Width and Height */}
            {selectedRate && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">
                    Width ({selectedRate.measurementUnit}){" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    disabled={selectedRate.rateType === "fixed"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">
                    Height ({selectedRate.measurementUnit}){" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    disabled={selectedRate.rateType === "fixed"}
                    required
                  />
                </div>
              </div>
            )}

            {/* Photo Capture */}
            <div className="space-y-2">
              <Label>
                Photo <span className="text-red-600">*</span>
              </Label>
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowCamera(true)}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {photo ? "Retake Photo" : "Capture Photo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    Upload Photo
                  </Button>
                </div>
                {photoPreview && (
                  <>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowEditor(true)}
                      className="w-full"
                    >
                      Edit Image
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Add Site"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Camera View - Renders when showCamera is true */}
      {showCamera && (
        <CameraView
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
          width={Number(width) || undefined}
          height={Number(height) || undefined}
        />
      )}

      {/* Image Editor - Renders above when showEditor is true */}
      {showEditor && editedImageUrl && (
        <ImageEditor
          imageUrl={editedImageUrl}
          onSave={handleSaveEditedImage}
          onCancel={() => setShowEditor(false)}
          rectInfo={rectInfo}
        />
      )}
    </>
  );
}
