"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { CameraView } from "@/components/ui/camera-view";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";

interface StorePhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raceeId: string;
  onSuccess: () => void;
}

export function StorePhotoModal({
  open,
  onOpenChange,
  raceeId,
  onSuccess,
}: StorePhotoModalProps) {
  const { accessToken } = useAuth();
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string>("");
  const [location, setLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-capture location when photo is selected
  React.useEffect(() => {
    if (photo && !location) {
      captureLocation();
    }
  }, [photo]);

  const captureLocation = () => {
    setIsCapturingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsCapturingLocation(false);
          toast.success("Location captured successfully");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get location. You can try again later.");
          setIsCapturingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
      setIsCapturingLocation(false);
    }
  };

  const handleCameraCapture = (imageSrc: string) => {
    // Convert base64 to blob then to file
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "store-photo.jpg", {
          type: "image/jpeg",
        });
        setPhoto(file);
        setPhotoPreview(imageSrc);
        setShowCamera(false);
      });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo) {
      toast.error("Please capture a photo");
      return;
    }

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

      // Prepare update data
      const updateData: any = {
        raceeId,
        newStorePhoto: photoUrl,
      };

      // Add location if captured
      if (location) {
        updateData.storeLocation = {
          type: "Point",
          coordinates: [location.longitude, location.latitude],
        };
      }

      // Update racee with new store photo and location
      const response = await fetch("/api/manager/racee/update-store-photo", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success(
          location
            ? "Store photo and location updated successfully"
            : "Store photo updated successfully",
        );
        onSuccess();
        onOpenChange(false);
        // Reset form
        setPhoto(null);
        setPhotoPreview("");
        setLocation(null);
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to update store photo");
      }
    } catch (error) {
      console.error("Error updating store photo:", error);
      toast.error("Failed to update store photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showCamera} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Store Photo</DialogTitle>
            <DialogDescription>
              Capture a new photo of the store
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Capture */}
            <div className="space-y-2">
              <Label>Store Photo *</Label>
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
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location Status */}
            {photo && (
              <div className="space-y-2">
                <Label>Location</Label>
                {isCapturingLocation ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Capturing location...
                  </div>
                ) : location ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Location captured successfully
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Location not captured
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureLocation}
                      className="w-full"
                    >
                      Capture Location
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/*   <Camera className="h-4 w-4 mr-2" />
                {photo ? 'Change Photo' : 'Capture Photo'}
              </Button>
              {photoPreview && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
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
              <Button type="submit" disabled={isSubmitting || !photo}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Save Photo"
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
        />
      )}
    </>
  );
}
