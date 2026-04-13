"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocationFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function LocationFilter({
  value,
  onValueChange,
  className,
}: LocationFilterProps) {
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState<string>("all");

  const getCurrentLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      onValueChange("all");
      setDisplayValue("all");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        onValueChange(coords);
        setDisplayValue("nearest");
        toast.success("Location detected successfully");
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        console.error("Geolocation error:", error);
        onValueChange("all");
        setDisplayValue("all");
        setIsGettingLocation(false);
      }
    );
  }, [onValueChange]);

  // Automatically get location when "nearest" is selected
  React.useEffect(() => {
    if (value === "nearest" && !isGettingLocation) {
      getCurrentLocation();
    } else if (value === "all") {
      setDisplayValue("all");
    } else if (!value.includes(",")) {
      setDisplayValue(value);
    }
  }, [value, getCurrentLocation, isGettingLocation]);

  const handleValueChange = (newValue: string) => {
    setDisplayValue(newValue);
    if (newValue === "all") {
      onValueChange("all");
    } else if (newValue === "nearest") {
      onValueChange("nearest");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          <SelectItem value="nearest">Nearest to Me</SelectItem>
        </SelectContent>
      </Select>
      {isGettingLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Getting location...</span>
        </div>
      )}
    </div>
  );
}
