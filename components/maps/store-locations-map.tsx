"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface StoreLocation {
  storeName: string;
  coordinates: number[]; // [longitude, latitude]
  elementName?: string;
}

interface StoreLocationWithDistance extends StoreLocation {
  distance?: number; // in kilometers
}

interface StoreLocationsMapProps {
  locations: StoreLocation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function StoreLocationsMap({ locations, open, onOpenChange }: StoreLocationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortedLocations, setSortedLocations] = useState<StoreLocationWithDistance[]>(locations);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Sort locations by distance when user location changes
  useEffect(() => {
    if (!userLocation) {
      setSortedLocations(locations);
      setTotalDistance(0);
      return;
    }

    const locationsWithDistance = locations.map((loc) => ({
      ...loc,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        loc.coordinates[1], // latitude
        loc.coordinates[0]  // longitude
      ),
    }));

    // Sort by distance (nearest first)
    locationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setSortedLocations(locationsWithDistance);

    // Calculate total travel distance (route through all stores in order)
    let total = 0;
    
    // Distance from user to first store
    if (locationsWithDistance.length > 0 && locationsWithDistance[0].distance) {
      total += locationsWithDistance[0].distance;
    }

    // Distance between consecutive stores
    for (let i = 0; i < locationsWithDistance.length - 1; i++) {
      const current = locationsWithDistance[i];
      const next = locationsWithDistance[i + 1];
      total += calculateDistance(
        current.coordinates[1],
        current.coordinates[0],
        next.coordinates[1],
        next.coordinates[0]
      );
    }

    setTotalDistance(total);
  }, [userLocation, locations]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        toast.success("Location detected successfully");
        setIsGettingLocation(false);

        // Add user marker to map if map is ready
        if (mapInstanceRef.current && window.google) {
          // Remove old marker if exists
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
          }

          // Add new user location marker
          const userMarker = new google.maps.Marker({
            position: coords,
            map: mapInstanceRef.current,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          });

          userMarkerRef.current = userMarker;

          // Recenter map to include user location
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(coords);
          sortedLocations.forEach((loc) => {
            bounds.extend({ lat: loc.coordinates[1], lng: loc.coordinates[0] });
          });
          mapInstanceRef.current.fitBounds(bounds);
        }
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
      }
    );
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (locations.length === 0) {
      setError('No store locations available to display.');
      setIsLoading(false);
      return;
    }

    // Wait for dialog content to render in DOM
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        setError('Map container not available. Please try again.');
        setIsLoading(false);
        return;
      }

      loadGoogleMaps();
    }, 100);

    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          setError('Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.');
          setIsLoading(false);
          return;
        }

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          initializeMap();
          return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          initializeMap();
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps. Please check your API key.');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        setError('An error occurred while loading the map.');
        setIsLoading(false);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || locations.length === 0) return;

      try {
        // Calculate center point
        const avgLat = locations.reduce((sum, loc) => sum + loc.coordinates[1], 0) / locations.length;
        const avgLng = locations.reduce((sum, loc) => sum + loc.coordinates[0], 0) / locations.length;

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: avgLat, lng: avgLng },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Create bounds to fit all markers
        const bounds = new google.maps.LatLngBounds();

        // Add markers for each location (use sorted locations if available)
        const displayLocations: StoreLocationWithDistance[] = sortedLocations.length > 0 ? sortedLocations : locations;
        
        displayLocations.forEach((location, index) => {
          const position = {
            lat: location.coordinates[1],
            lng: location.coordinates[0],
          };

          // Highlight nearest location with different color
          const isNearest = index === 0 && userLocation && location.distance !== undefined;
          
          // Create marker
          const marker = new google.maps.Marker({
            position,
            map,
            title: location.storeName,
            label: {
              text: `${index + 1}`,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
            },
            animation: google.maps.Animation.DROP,
            icon: isNearest ? {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              rotation: 180,
            } : undefined,
          });

          // Create info window with distance if available
          const distanceInfo = location.distance !== undefined 
            ? `<p style="margin: 4px 0; font-size: 13px; color: #10b981; font-weight: bold;">
                 📍 ${location.distance.toFixed(2)} km away
               </p>` 
            : '';

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
                  ${isNearest ? '⭐ ' : ''}${location.storeName}
                </h3>
                ${location.elementName ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${location.elementName}</p>` : ''}
                ${distanceInfo}
                <a href="https://www.google.com/maps?q=${location.coordinates[1]},${location.coordinates[0]}" target="_blank" style="font-size: 13px; color: #3b82f6; text-decoration: none;">
                  Open in Google Maps
                </a>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          bounds.extend(position);
        });

        // Fit map to show all markers
        if (locations.length > 1) {
          map.fitBounds(bounds);
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize map.');
        setIsLoading(false);
      }
    };

    return () => {
      clearTimeout(timer);
      mapInstanceRef.current = null;
    };
  }, [open, locations, sortedLocations, userLocation]);

  const handleOpenInGoogleMaps = () => {
    if (locations.length === 0) return;

    let url = 'https://www.google.com/maps/dir/';
    
    if (locations.length === 1) {
      const [lng, lat] = locations[0].coordinates;
      url = `https://www.google.com/maps?q=${lat},${lng}`;
    } else {
      locations.forEach((location) => {
        const [lng, lat] = location.coordinates;
        url += `${lat},${lng}/`;
      });
    }

    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Store Locations ({locations.length} {locations.length === 1 ? 'location' : 'locations'})
            {userLocation && totalDistance > 0 && (
              <span className="ml-2 text-sm font-normal text-green-600">
                • Total Travel: {totalDistance.toFixed(2)} km
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Map Container */}
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center p-4">
                  <p className="text-sm text-red-600 mb-2">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    Make sure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in your environment variables
                  </p>
                </div>
              </div>
            )}

            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Location List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">
              {userLocation ? 'Locations (Sorted by Distance):' : 'Locations:'}
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {sortedLocations.map((location, index) => {
                const isNearest = index === 0 && userLocation && location.distance !== undefined;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                      isNearest ? 'bg-green-50 border border-green-200' : ''
                    }`}
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setCenter({
                          lat: location.coordinates[1],
                          lng: location.coordinates[0],
                        });
                        mapInstanceRef.current.setZoom(16);
                      }
                    }}
                  >
                    <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${
                      isNearest ? 'bg-green-600' : 'bg-primary'
                    } text-primary-foreground text-xs font-bold`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">
                        {isNearest && '⭐ '}
                        {location.storeName}
                      </p>
                      {location.elementName && (
                        <p className="text-xs text-muted-foreground">{location.elementName}</p>
                      )}
                      {location.distance !== undefined && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          📍 {location.distance.toFixed(2)} km away
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-2">
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Nearest to Me
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleOpenInGoogleMaps} className="gap-2">
                <MapPin className="h-4 w-4" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}
