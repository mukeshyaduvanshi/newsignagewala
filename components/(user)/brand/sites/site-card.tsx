"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Site } from "@/hooks/use-store-sites";
import {
  Ruler,
  DollarSign,
  ShoppingCart,
  Eye,
  CrossIcon,
  EyeClosed,
} from "lucide-react";
// import { Button } from "@/components/animate-ui/primitives/buttons/button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addToCart,
  removeFromCart,
  setCartDrawerOpen,
} from "@/lib/redux/features/cart-slice";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { Close } from "@radix-ui/react-popover";

interface SiteCardProps {
  site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string>("");
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const dispatch = useAppDispatch();
  const { accessToken } = useAuth();
  const cartItems = useAppSelector((state) => state.cart.items);

  // Check if item is already in cart
  const isInCart = cartItems.some((item) => item._id === site._id);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImagePreviewOpen(true);
  };

  const handleAddToCart = () => {
    if (!accessToken) {
      toast.error("Please login to add items to cart");
      return;
    }

    dispatch(addToCart(site));

    // Save to database
    fetch("/api/brand/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        siteId: site._id,
        elementName: site.elementName,
        siteDescription: site.siteDescription,
        photo: site.photo,
        width: site.width,
        height: site.height,
        measurementUnit: site.measurementUnit,
        rate: site.rate,
        calculateUnit: site.calculateUnit,
        storeName: site.storeName,
        storeId: site.storeId,
        storeLocation: site.storeLocation,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.success("Added to cart!", {
            description: `${site.siteDescription || site.elementName} has been added to your cart.`,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to add to cart:", error);
        toast.error("Failed to add to cart");
      });
  };

  const handleRemoveFromCart = () => {
    if (!accessToken) return;

    dispatch(removeFromCart(site._id));

    // Remove from database
    fetch(`/api/brand/cart?siteId=${site._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.success("Removed from cart!", {
            description: `${site.siteDescription || site.elementName} has been removed from your cart.`,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to remove from cart:", error);
        toast.error("Failed to remove from cart");
      });
  };

  return (
    <Card className="overflow-hidden  hover:shadow-lg transition-shadow duration-300 group p-0 gap-0">
      {/* Image with Floating Elements */}
      <div
        className="relative w-full h-56 lg:h-64 rounded-t-lg overflow-hidden bg-muted cursor-pointer"
        onClick={() => handleImageClick(site.photo)}
      >
        {!imageError && site.photo ? (
          <img
            src={site.photo}
            alt={site.elementName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}

        {/* Dark Overlay for better text visibility
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}

        {/* Top Left: Site Dimensions Floating */}
        <div className="absolute top-1 left-1 z-10">
          <div className="bg-black/50 dark:bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 w-full">
            <p className="text-xs text-gray-200 truncate">
              {site.width} x {site.height} {site.measurementUnit}
            </p>
          </div>
        </div>

        {/* Right Bottom Side: Floating Buttons */}
        <div className="absolute right-2 bottom-2 flex gap-3 z-10">
          {/* Add/Remove Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              isInCart ? handleRemoveFromCart() : handleAddToCart();
            }}
            className={`rounded-full p-2.5 backdrop-blur-sm shadow-lg transition-all duration-200 flex items-center justify-center ${
              isInCart
                ? "bg-red-500/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-700 text-white"
                : "bg-white/80 dark:bg-slate-900/80 hover:bg-blue-500 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-300 hover:text-white"
            }`}
            aria-label={isInCart ? "Remove from cart" : "Add to cart"}
            title={isInCart ? "Remove from cart" : "Add to cart"}
          >
            <ShoppingCart className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Minimal Content Section - Optional: Show on hover or minimal info */}
      <CardContent className="p-1 lg:p-2 bg-white dark:bg-slate-950">
        <p className="text-xs font-semibold text-white truncate">
          {site.siteDescription || site.elementName}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {site.elementName}
        </p>
        <p className="text-xs font-bold text-blue-300 mt-1">
          ₹{site.rate}/{site.calculateUnit}
        </p>
      </CardContent>
      {/* Image Preview Modal */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-h-screen max-w-4xl w-full p-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-1 p-4 bg-linear-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {site.siteDescription || site.elementName}

                <Badge variant="secondary" className="ml-2 text-xs">
                  {site.storeName}
                </Badge>
              </h3>

              <p className="text-sm text-slate-300 mb-2 whitespace-nowrap truncate">
                {site.elementName}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {site.width} x {site.height} {site.measurementUnit}
                </span>
                <span className="flex items-center gap-1">
                  ₹ {site.rate}/{site.calculateUnit}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isInCart ? handleRemoveFromCart() : handleAddToCart();
                  }}
                  className={`rounded-full p-2.5 backdrop-blur-sm shadow-lg transition-all duration-200 flex items-center justify-center ${
                    isInCart
                      ? "bg-red-500/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-700 text-white"
                      : "bg-white/80 dark:bg-slate-900/80 hover:bg-blue-500 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-300 hover:text-white"
                  }`}
                  aria-label={isInCart ? "Remove from cart" : "Add to cart"}
                  title={isInCart ? "Remove from cart" : "Add to cart"}
                >
                  <ShoppingCart className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <img
            src={selectedImage}
            onClick={() => setImagePreviewOpen(false)}
            alt="Site Preview"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
