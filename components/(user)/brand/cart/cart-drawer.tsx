"use client";

import * as React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setCartDrawerOpen,
  removeFromCart,
  updateQuantity,
} from "@/lib/redux/features/cart-slice";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { accessToken } = useAuth();
  const isOpen = useAppSelector((state) => state.cart.isOpen);
  const cartItems = useAppSelector((state) => state.cart.items);

  const totalAmount = cartItems.reduce((total, item) => {
    const itemTotal = priceCalculatorNumber(item);
    return total + itemTotal;
  }, 0);

  const handleRemoveItem = async (siteId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`/api/brand/cart?siteId=${siteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        dispatch(removeFromCart(siteId));
        toast.success("Item removed from cart");
      } else {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleUpdateQuantity = async (siteId: string, quantity: number) => {
    if (!accessToken) return;

    try {
      const response = await fetch("/api/brand/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ siteId, quantity }),
      });

      if (response.ok) {
        dispatch(updateQuantity({ siteId, quantity }));
      } else {
        toast.error("Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleCheckout = () => {
    dispatch(setCartDrawerOpen(false));
    router.push("/brand/checkout");
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => dispatch(setCartDrawerOpen(open))}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({cartItems.length})
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Your cart is empty
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Add sites to your cart to get started
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-250px)] mt-6">
              <div className="space-y-4 pr-4">
                {cartItems.map((item) => {
                  const itemTotal = priceCalculatorNumber(item);

                  return (
                    <div
                      key={item.cartItemId}
                      className="flex gap-4 p-4 border rounded-lg"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0 bg-muted">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.elementName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.siteDescription || item.elementName} at{" "}
                          <span className="text-primary">
                            {" "}
                            {item.storeName}
                          </span>
                        </h4>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.elementName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.width}(w) x {item.height}(h) {item.measurementUnit}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item._id,
                                  item.quantity - 1,
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item._id,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-semibold">
                            ₹{itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleRemoveItem(item._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
