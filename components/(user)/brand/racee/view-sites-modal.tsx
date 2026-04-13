"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";

interface Site {
  _id?: string;
  rateId: string;
  elementName: string;
  uniqueKey: string;
  description?: string;
  siteDescription?: string;
  rateType: "fixed" | "custom";
  measurementUnit: string;
  calculateUnit: string;
  width: number;
  height: number;
  rate: number;
  photo: string;
  location: {
    type: string;
    coordinates: number[];
  };
  createdAt: string;
}

interface ViewSitesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  newStorePhoto?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  storeName?: string;
}

export function ViewSitesModal({
  open,
  onOpenChange,
  sites,
  newStorePhoto,
  storeLocation,
  storeName,
}: ViewSitesModalProps) {
  const [selectedImage, setSelectedImage] = React.useState<string>("");
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImagePreviewOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Racee Sites</DialogTitle>
            <DialogDescription>
              All sites created for this racee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {sites && sites.length > 0 ? (
              <div className="grid grid-cols-1  gap-4">
                {sites.map((site, index) => (
                  <div
                    key={site._id || index}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Site Image */}
                    <div
                      className="relative w-full h-48 rounded-lg overflow-hidden mb-4 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => handleImageClick(site.photo)}
                    >
                      <img
                        src={site.photo}
                        alt={site.elementName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Site Details */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {site.siteDescription
                            ? site.siteDescription
                            : site.elementName}
                        </h3>
                        {/* {site.description && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-gray-700">Rate Description:</span>
                            <p className="text-sm text-gray-600 mt-1">
                              {site.description}
                            </p>
                          </div>
                        )} */}
                        {site.elementName && (
                          <div className="mt-2">
                            {/* <span className="text-sm font-medium text-gray-700">Site Description:</span> */}
                            <p className="text-sm text-white mt-1">
                              {site.elementName} <br /> {site.width}(w) x{" "}
                              {site.height}(h) {site.measurementUnit} @ ₹
                              {site.rate}/{site.calculateUnit}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Rate Type:</span>
                          <Badge variant="outline" className="ml-2">
                            {site.rateType}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600">Unit:</span>
                          <span className="ml-2">{site.measurementUnit}</span>
                        </div>
                      </div> */}

                      {/* <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Width:</span>
                          <span className="ml-2">
                            {site.width} {site.measurementUnit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Height:</span>
                          <span className="ml-2">
                            {site.height} {site.measurementUnit}
                          </span>
                        </div>
                      </div> */}
                      <div className="flex justify-between items-center gap-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Est Cost:</span>
                          <span className="font-semibold ml-2">
                            ₹{priceCalculatorNumber(site).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Created Date */}
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Created: {new Date(site.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No sites added yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-3xl">
          <img
            src={selectedImage}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
