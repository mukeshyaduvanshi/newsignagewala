"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CircleCheckBig,
  FileSearch,
  Trash2,
  Image as ImageIcon,
  MapPin,
  Ruler,
  Package,
  Calendar,
  User,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { InstallCertData, InstallCertSite } from '@/hooks/use-order-install-certs';

interface InstallerInfo {
  name: string;
  phone: string;
  capturedAt: Date;
}

interface ReviewInstallationImagesProps {
  open: boolean;
  onClose: () => void;
  certData: InstallCertData | null;
  mutateJobCards: () => void; // Function to refresh job cards after submission
  orderId: string;
  accessToken: string;
  onSuccess: () => void;
  orderSites?: any[]; // Order sites to check which are already submitted
}

export const ReviewInstallationImages: React.FC<ReviewInstallationImagesProps> = ({
  open,
  onClose,
  certData,
  mutateJobCards,
  orderId,
  accessToken,
  onSuccess,
  orderSites = [],
}) => {
  const [selectedImages, setSelectedImages] = useState<{[siteId: string]: string[]}>({});
  const [submittingSiteId, setSubmittingSiteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // console.log({certData});
  

  // Initialize selected images when modal opens
  React.useEffect(() => {
    if (certData && open) {
      const initialSelection: {[siteId: string]: string[]} = {};
      certData.sites.forEach((site) => {
        if (site.capturedImages && site.capturedImages.length > 0 && site.siteId) {
          initialSelection[site.siteId] = [...site.capturedImages];
        }
      });
      setSelectedImages(initialSelection);
    }
  }, [certData, open]);

  const handleToggleImage = (siteId: string, imageUrl: string) => {
    setSelectedImages(prev => {
      const siteImages = prev[siteId] || [];
      if (siteImages.includes(imageUrl)) {
        return {
          ...prev,
          [siteId]: siteImages.filter(img => img !== imageUrl)
        };
      } else {
        return {
          ...prev,
          [siteId]: [...siteImages, imageUrl]
        };
      }
    });
  };

  const handleSelectAllForSite = (siteId: string, allImages: string[]) => {
    const siteImages = selectedImages[siteId] || [];
    if (siteImages.length === allImages.length) {
      // Deselect all
      setSelectedImages(prev => ({
        ...prev,
        [siteId]: []
      }));
    } else {
      // Select all
      setSelectedImages(prev => ({
        ...prev,
        [siteId]: [...allImages]
      }));
    }
  };

  const handleSubmitSite = async (siteId: string) => {
    if (!certData) return;

    const site = certData.sites.find(s => s.siteId === siteId);
    if (!site) return;

    const siteImages = selectedImages[siteId];
    if (!siteImages || siteImages.length === 0) {
      toast.error('Please select at least one image for this site');
      return;
    }

    setSubmittingSiteId(siteId);
    try {
      const response = await fetch('/api/vendor/orders/submit-installation-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          certificateId: certData._id,
          siteId: siteId, // Send siteId directly
          selectedImages: siteImages, // Send array directly
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit images');
      }

      toast.success(`${siteImages.length} image${siteImages.length > 1 ? 's' : ''} submitted for this site!`);
      mutateJobCards(); // Refresh job cards
      onSuccess(); // Refresh data
    } catch (error: any) {
      console.error('Error submitting images:', error);
      toast.error(error.message || 'Failed to submit images');
    } finally {
      setSubmittingSiteId(null);
    }
  };

  // Check if a site is already submitted to order
  const isSiteSubmitted = (certSite: InstallCertSite): boolean => {
    if (!orderSites || orderSites.length === 0) return false;
    
    const orderSite = orderSites.find(
      (os: any) => os.siteId === certSite.siteId
    );
    
    // Check if site has status "submitted" or capturedImages
    return orderSite?.status === 'submitted' || 
           (orderSite?.capturedImages && orderSite.capturedImages.length > 0);
  };

  const getTotalSelectedImages = () => {
    return Object.values(selectedImages).reduce((total, imgs) => total + imgs.length, 0);
  };

  const getTotalCapturedImages = () => {
    if (!certData) return 0;
    return certData.sites.reduce((total, site) => total + (site.capturedImages?.length || 0), 0);
  };

  if (!certData) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Review Captured Images</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {certData.orderNumber} • Select images to finalize
                </p>
              </div>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {getTotalSelectedImages()} / {getTotalCapturedImages()} Selected
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[calc(95vh-12rem)] px-6">
            <div className="space-y-6 py-4">
              {certData.sites.map((site) => {
                if (!site.capturedImages || site.capturedImages.length === 0 || !site.siteId) return null;
                
                const siteId = site.siteId;
                const siteSelectedImages = selectedImages[siteId] || [];
                const allSelected = siteSelectedImages.length === site.capturedImages.length;
                
                return (
                  <Card key={siteId} className="overflow-hidden border-2">
                    <CardHeader className="bg-liner-to-r from-primary/5 to-primary/10 pb-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{site.elementName}</CardTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{site.storeName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ruler className="h-4 w-4" />
                              <span>{site.width} x {site.height} {site.measurementUnit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>Qty: {site.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              <span>{site.capturedImages.length} images</span>
                            </div>
                          </div>
                          {site.siteDescription && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {site.siteDescription}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          {site.status === 'vendorVerified' || site.status === 'submitted' ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Vendor Verified
                            </Badge>
                          ) : (
                            <>
                              <Badge 
                                variant={allSelected ? "default" : "outline"}
                                className="text-sm"
                              >
                                {siteSelectedImages.length} / {site.capturedImages?.length || 0}
                              </Badge>
                              <Button
                                variant={allSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSelectAllForSite(siteId, site.capturedImages || [])}
                                disabled={submittingSiteId === siteId}
                              >
                                {allSelected ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Deselect All
                                  </>
                                ) : (
                                  <>
                                    <CircleCheckBig className="h-4 w-4 mr-1" />
                                    Select All
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSubmitSite(siteId)}
                                disabled={submittingSiteId !== null || siteSelectedImages.length === 0}
                              >
                                {submittingSiteId === siteId ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <CircleCheckBig className="h-3 w-3 mr-1" />
                                    Submit Site
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4">
                      {/* Site Reference Image */}
                      {site.photo && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Site Reference:</p>
                          <img
                            src={site.photo}
                            alt={site.elementName}
                            className="h-24 w-auto rounded-lg border object-cover cursor-pointer hover:opacity-80 transition"
                            onClick={() => setPreviewImage(site.photo!)}
                          />
                        </div>
                      )}

                      {/* Captured Images Grid */}
                      {!isSiteSubmitted(site) ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Captured Images:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {site.capturedImages.map((imageUrl, imgIndex) => {
                              const isSelected = siteSelectedImages.includes(imageUrl);
                              
                              return (
                                <div
                                  key={imgIndex}
                                  className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-primary ring-4 ring-primary/20 shadow-lg'
                                      : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
                                  }`}
                                  onClick={() => handleToggleImage(siteId, imageUrl)}
                                >
                                  <div className="aspect-square">
                                    <img
                                      src={imageUrl}
                                      alt={`${site.elementName} - ${imgIndex + 1}`}
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
                                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                                        isSelected 
                                          ? 'bg-primary scale-100' 
                                          : 'bg-white/90 scale-0 group-hover:scale-100'
                                      }`}
                                    >
                                      {isSelected ? (
                                        <CircleCheckBig className="h-6 w-6 text-white" />
                                      ) : (
                                        <div className="h-5 w-5 border-2 border-gray-600 rounded-full" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Image Number Badge */}
                                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                    #{imgIndex + 1}
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
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Submitted Images:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {site.capturedImages.map((imageUrl, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="relative group rounded-lg overflow-hidden border-2 border-green-200 bg-green-50/50"
                              >
                                <div className="aspect-square">
                                  <img
                                    src={imageUrl}
                                    alt={`${site.elementName} - ${imgIndex + 1}`}
                                    className="w-full h-full object-cover opacity-90"
                                  />
                                </div>
                                
                                {/* Submitted Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-green-600/10">
                                  <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                                
                                {/* Image Number Badge */}
                                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                                  #{imgIndex + 1}
                                </div>

                                {/* Preview Button - still functional */}
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
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Installer Info */}
                      {site.installers && site.installers.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Installer Details:</p>
                          <div className="space-y-2">
                            {site.installers.map((installer, idx) => (<>
                              <div key={idx} className="flex items-center gap-4 text-sm bg-muted/30 p-2 rounded">
                                <div className="flex items-center gap-2 flex-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{installer.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{installer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-xs">
                                    {installer.capturedAt ? format(new Date(installer.capturedAt), 'dd MMM, HH:mm') : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              {installer.remarks && (
                                <div className="flex items-center gap-2 text-muted-foreground px-2">
                                <p className='font-bold text-xs'>Remarks:</p>
                                <p className="text-xs italic font-bold">{installer.remarks || ''}</p>
                              </div>
                              )}
                            </>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {certData.sites.every(site => !site.capturedImages || site.capturedImages.length === 0) && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileSearch className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No Captured Images</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This installation certificate doesn't have any captured images yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">💡 Tip: Submit each site individually</p>
                <p className="text-xs mt-0.5">Select images for each site and click "Submit Site" button. Already submitted sites will show a green checkmark.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={submittingSiteId !== null}
                  className="flex-1 sm:flex-initial"
                >
                  Close
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
