"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link as LinkIcon, FileText } from "lucide-react";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";

interface CartItem {
  cartItemId: string;
  siteId?: string;
  _id: string;
  elementName: string;
  siteDescription?: string;
  photo?: string;
  width: number | string;
  height: number | string;
  measurementUnit: string;
  rate: number | string;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
}

interface OrderSummaryProps {
  visibleCartItems: CartItem[];
  totalAmount: number;
  totalAdditionalCharges: number;
}

export function OrderSummary({
  visibleCartItems,
  totalAmount,
  totalAdditionalCharges,
}: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          {visibleCartItems.length} item{visibleCartItems.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-4">
            {visibleCartItems.map((item) => {
              const itemTotal = priceCalculatorNumber(item);

              return (
                <div key={item.cartItemId} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium truncate">
                        {item.siteDescription || item.elementName}
                      </h4>
                      <TooltipProvider>
                        <div className="flex gap-1 shrink-0">
                          {item.creativeLink && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => window.open(item.creativeLink, "_blank")}
                                >
                                  <LinkIcon className="h-3 w-3 text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">View Creative Link</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {item.instructions && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <FileText className="h-3 w-3 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs whitespace-pre-wrap">
                                  {item.instructions}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.width}(w) x {item.height}(h) {item.measurementUnit}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">Qty: {item.quantity}</span>
                      <span className="text-sm font-semibold">
                        ₹{itemTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          {totalAdditionalCharges > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Additional Charges</span>
              <span>₹{totalAdditionalCharges.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax (GST 18%)</span>
            <span>₹{((totalAmount + totalAdditionalCharges) * 0.18).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{((totalAmount + totalAdditionalCharges) * 1.18).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
