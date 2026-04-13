"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CircleCheckBig, 
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';
import { Input } from '@/components/ui/input';
interface SiteData {
  siteId: string;
  elementName: string;
  storeName: string;
  photo?: string;
  capturedImages?: string[];
  [key: string]: any;
}

interface SetSiteReferenceImageProps {
  open: boolean;
  onClose: () => void;
  site: SiteData | null;
  siteIndex: number;
  orderId: string;
  accessToken: string;
  onSuccess: () => void;
}

export const SetSiteReferenceImage: React.FC<SetSiteReferenceImageProps> = ({
  open,
  onClose,
  site,
  siteIndex,
  orderId,
  accessToken,
  onSuccess,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  

  // Reset selection when site changes or modal opens
  React.useEffect(() => {
    if (site && open) {
      setSelectedImage(null);
    }
  }, [site, open]);

  const handleSubmit = async () => {
    if (!selectedImage || !site) {
      toast.error('Please select an image');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/brand/orders/set-site-reference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          siteIndex: siteIndex,
          newReferenceImage: selectedImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set reference image');
      }

      toast.success('Reference image updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error setting reference image:', error);
      toast.error(error.message || 'Failed to update reference image');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!site) return null;

  // add remarks for reject site handler
  const handleSubmitRejectSite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!remarks) {
      toast.error('Please add remarks for rejecting this site');
      return;
    }

    if (!site || !site.siteId) {
      toast.error('Invalid site data');
      return;
    }

    setIsRejecting(true);
    try {
      const response = await fetch('/api/brand/orders/reject-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          siteId: site.siteId,
          remarks: remarks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject site');
      }

      toast.success('Site rejected successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error rejecting site:', error);
      toast.error(error.message || 'Failed to reject site');
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Set Reference Image</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {site.elementName} • {site.storeName}
                </p>
              </div>
              {selectedImage && (
                <Badge variant="default" className="text-base px-4 py-2">
                  <CircleCheckBig className="h-4 w-4 mr-1" />
                  Image Selected
                </Badge>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-12rem)] px-6">
            <div className="space-y-6 py-4">
              {/* Current Reference Image */}
              <Card className="border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary">Current Reference Image</p>
                      <Badge variant="secondary">Original</Badge>
                    </div>
                    {site.photo ? (
                      <img
                        src={site.photo}
                        alt="Current Reference"
                        className="w-full max-h-64 object-contain rounded-lg border cursor-pointer hover:opacity-80 transition"
                        onClick={() => setPreviewImage(site.photo!)}
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">No reference image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Add a Remarks */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-4">
                      <p className="text-sm font-semibold">Remarks:</p>
                      <Input placeholder='Add a Remarks for reject this site' onChange={(e) => setRemarks(e.target.value)}/>
                  </div>
                    </div>
                </CardContent>
              </Card>

              {/* Captured Images Selection */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Select New Reference Image</p>
                      <Badge variant="outline">
                        {site.capturedImages?.length || 0} Captured Images
                      </Badge>
                    </div>

                    {site.capturedImages && site.capturedImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {site.capturedImages.map((imageUrl, index) => {
                          const isSelected = selectedImage === imageUrl;
                          
                          return (
                            <div
                              key={index}
                              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-primary ring-4 ring-primary/30 shadow-lg scale-105'
                                  : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
                              }`}
                              onClick={() => setSelectedImage(imageUrl)}
                            >
                              <div className="aspect-square">
                                <img
                                  src={imageUrl}
                                  alt={`Captured ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              {/* Selection Overlay */}
                              <div
                                className={`absolute inset-0 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-primary/30'
                                    : 'bg-black/0 group-hover:bg-black/20'
                                }`}
                              >
                                <div
                                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-primary scale-100' 
                                      : 'bg-white/90 scale-0 group-hover:scale-100'
                                  }`}
                                >
                                  {isSelected ? (
                                    <CircleCheckBig className="h-7 w-7 text-white" />
                                  ) : (
                                    <div className="h-6 w-6 border-2 border-gray-600 rounded-full" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Image Number Badge */}
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                #{index + 1}
                              </div>

                              {/* Preview Button */}
                              <button
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(imageUrl);
                                }}
                              >
                                <ImageIcon className="h-3 w-3 text-gray-700" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Captured Images</p>
                        <p className="text-sm mt-1">This site doesn't have any captured images yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview of Selected Image */}
              {selectedImage && (
                <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                          New Reference Image (Preview)
                        </p>
                        <Badge variant="default" className="bg-green-600">Selected</Badge>
                      </div>
                      <img
                        src={selectedImage}
                        alt="Selected Reference"
                        className="w-full max-h-64 object-contain rounded-lg border cursor-pointer hover:opacity-80 transition"
                        onClick={() => setPreviewImage(selectedImage)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">💡 Tip: Click on an image to select it as the new reference</p>
                <p className="text-xs mt-0.5">This will replace the current reference image for this site</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleSubmitRejectSite}
                  disabled={!remarks}
                  className="flex-1 sm:flex-initial"
                >
                  Reject Site
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedImage}
                  className="flex-1 sm:flex-initial min-w-[180px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Set as Reference
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-2">
          <div className="relative w-full">
            <img
              src={previewImage || ''}
              alt="Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
