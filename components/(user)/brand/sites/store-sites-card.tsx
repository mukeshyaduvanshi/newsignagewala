"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SitesGrid } from "./sites-grid";
import { SitesSearch } from "./sites-search";
import { useStoreSites } from "@/hooks/use-store-sites";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Store } from "@/hooks/use-brand-stores";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";

interface StoreSitesCardProps {
  store: Store;
  onSitesCountChange?: (storeId: string, hasSites: boolean) => void;
}

export function StoreSitesCard({
  store,
  onSitesCountChange,
}: StoreSitesCardProps) {
  // ✅ ALL HOOKS AT TOP - Before any return
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [imageError, setImageError] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string>("");
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);

  const isMobile = useIsMobile();
  const { sites, isLoading } = useStoreSites(store._id);

  // Responsive limits: 2 for mobile, 4 for desktop
  const initialLimit = isMobile ? 2 : 4;

  // Notify parent about sites count
  React.useEffect(() => {
    if (!isLoading && onSitesCountChange) {
      onSitesCountChange(store._id, sites.length > 0);
    }
  }, [sites.length, isLoading, store._id, onSitesCountChange]);

  // Filter sites based on search
  const filteredSites = React.useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const query = searchQuery.toLowerCase();
    return sites.filter(
      (site) =>
        site.elementName?.toLowerCase().includes(query) ||
        site.rateType?.toLowerCase().includes(query) ||
        site.siteDescription?.toLowerCase().includes(query),
    );
  }, [sites, searchQuery]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImagePreviewOpen(true);
  };

  // ✅ Conditional return AFTER all hooks
  if (!isLoading && sites.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 p-0 gap-2">
      <CardHeader className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-2 lg:p-4">
        {/* Mobile Layout */}
        <div className="flex flex-col sm:hidden gap-2">
          {/* Top Row: Image + Name + Badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-16 h-16 overflow-hidden rounded-full bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0"
              onClick={() =>
                store.storeImage && handleImageClick(store.storeImage)
              }
            >
              {store.storeImage && !imageError ? (
                <img
                  src={store.storeImage}
                  alt={store.storeName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-gray-400 text-xs">No</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm truncate">
                {store.storeName}
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                {store.storeCity}, {store.storeState}
                {/* Second Row: Address */}
                <p className="text-xs text-muted-foreground truncate">
                  {store.storeAddress} • {store.storePincode}
                </p>
              </p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {isLoading ? "..." : `${sites.length}`}
            </Badge>
          </div>

          {/* Button Row */}
          {sites.length > initialLimit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`gap-2 w-full  text-xs ${isExpanded ? "" : "hidden"}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  View {sites.length - initialLimit} More Sites
                </>
              )}
            </Button>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between ">
          <div className="flex gap-2 items-center min-w-0">
            {/* Store Image */}
            <div
              className="w-16 h-16 overflow-hidden rounded-full bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0"
              onClick={() =>
                store.storeImage && handleImageClick(store.storeImage)
              }
            >
              {store.storeImage && !imageError ? (
                <img
                  src={store.storeImage}
                  alt={store.storeName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-gray-400 text-xs">No</span>
                </div>
              )}
            </div>

            {/* Store Details */}
            <div className="flex flex-col w-full">
              <CardTitle className="text-lg truncate">
                {store.storeName}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground truncate">
                {store.storeAddress}
                {store.storeCity}, {store.storeState}
                {store.storePincode}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* <Badge variant="secondary" className="text-sm">
              {isLoading ? "Loading..." : `${sites.length} Sites`}
            </Badge> */}
            {sites.length > initialLimit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`gap-2 w-full h-8 text-xs ${isExpanded ? "" : "hidden"}`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Expand to view {sites.length - initialLimit} More Sites
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isExpanded ? (
          <div className="space-y-2">
            {/* Search Bar */}
            <SitesSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Scrollable Sites Grid */}
            <ScrollArea className="h-[600px] pr-0">
              {filteredSites.length > 0 ? (
                <SitesGrid sites={filteredSites} />
              ) : (
                <div className="text-center py-2 text-muted-foreground">
                  No sites found matching "{searchQuery}"
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <SitesGrid sites={sites} limit={initialLimit} />
        )}
      </CardContent>
      <CardFooter className="p-0 sm:p-6">
        {!isLoading && sites.length > initialLimit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`gap-2 w-full h-8 text-xs ${isExpanded ? "hidden" : "rounded-t-none lg:rounded-lg border-0 border-t-2 lg:border-2"}`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                View {sites.length - initialLimit} More Sites
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
      {/* Image Preview Modal */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-black/50 backdrop-blur-sm flex flex-col">
          <img
            src={selectedImage}
            alt="Store Image Preview"
            className="w-full max-h-[80vh] rounded"
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
