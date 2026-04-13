"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

interface LocationCaptureProps {
  onLocationCapture: (coordinates: { latitude: number; longitude: number }) => void;
  currentLocation?: { latitude: number; longitude: number } | null;
}

export function LocationCapture({ onLocationCapture, currentLocation }: LocationCaptureProps) {
  const [isCapturing, setIsCapturing] = React.useState(false);

  const handleCaptureLocation = () => {
    setIsCapturing(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsCapturing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        onLocationCapture(coordinates);
        toast.success('Location captured successfully');
        setIsCapturing(false);
      },
      (error) => {
        toast.error('Failed to capture location: ' + error.message);
        setIsCapturing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCaptureLocation}
          disabled={isCapturing}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {isCapturing ? 'Capturing...' : 'Capture Location'}
        </Button>
        {currentLocation && (
          <span className="text-sm text-green-600">
            ✓ Location captured
          </span>
        )}
      </div>
      {currentLocation && (
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>Latitude: {currentLocation.latitude.toFixed(6)}</p>
          <p>Longitude: {currentLocation.longitude.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
}
