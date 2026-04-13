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
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";

interface StoreLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raceeId: string;
  onSuccess: () => void;
}

export function StoreLocationModal({
  open,
  onOpenChange,
  raceeId,
  onSuccess,
}: StoreLocationModalProps) {
  const { accessToken } = useAuth();
  const [location, setLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const captureLocation = () => {
    setIsCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsCapturing(false);
          toast.success('Location captured successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get location. Please try again.');
          setIsCapturing(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error('Please capture location first');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/manager/racee/update-store-location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          raceeId,
          storeLocation: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
        }),
      });

      if (response.ok) {
        toast.success('Store location saved successfully');
        onSuccess();
        onOpenChange(false);
        setLocation(null);
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Capture Store Location</DialogTitle>
          <DialogDescription>
            Capture the current GPS location of the store
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Capture */}
          <div className="space-y-3">
            <Label>GPS Location *</Label>
            
            {!location ? (
              <Button
                type="button"
                variant="outline"
                onClick={captureLocation}
                disabled={isCapturing}
                className="w-full h-24"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Capturing Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 mr-2" />
                    Capture Location
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Location Captured</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureLocation}
                  disabled={isCapturing}
                  className="w-full"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Re-capturing...
                    </>
                  ) : (
                    'Re-capture Location'
                  )}
                </Button>
              </div>
            )}
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
            <Button type="submit" disabled={isSubmitting || !location}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Location'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
