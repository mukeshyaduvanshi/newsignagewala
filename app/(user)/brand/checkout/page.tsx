"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  clearCart,
  updateQuantity,
  removeBulkItems,
} from "@/lib/redux/features/cart-slice";
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Link as LinkIcon,
  FileText,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { useBrandCheckoutInit } from "@/lib/hooks/brand/useBrandCheckoutInit";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";
import { OrderInformation } from "@/components/(user)/brand/checkout/order-information";
import { OrderSites } from "@/components/(user)/brand/checkout/order-sites";
import { AdditionalNotes } from "@/components/(user)/brand/checkout/additional-notes";
import { OrderSummary } from "@/components/(user)/brand/checkout/order-summary";
import { VendorSelectionModal } from "@/components/(user)/brand/checkout/vendor-selection-modal";
import { POSummary } from "@/components/(user)/brand/checkout/po-summary";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";
import { OrderSite, CreateOrderPayload } from "@/types/order.types";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken } = useAuth();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hiddenItemIds, setHiddenItemIds] = React.useState<string[]>([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = React.useState(false);
  const [pendingOrderType, setPendingOrderType] = React.useState<
    "order" | "tender" | null
  >(null);
  const [selectedStore, setSelectedStore] = React.useState<{
    _id: string;
    pincode: string;
    location?: { type: string; coordinates: number[] };
  } | null>(null);
  const [orderType, setOrderType] = React.useState<"order" | "tender">("order");
  const [purchaseAuthorities, setPurchaseAuthorities] = React.useState<any[]>(
    [],
  );
  const [tenderNumber, setTenderNumber] = React.useState("");
  const [selectedPODetails, setSelectedPODetails] = React.useState<any>(null);
  const [wantCreativeManagers, setWantCreativeManagers] =
    React.useState<boolean>(false);
  const [creativeManagers, setCreativeManagers] = React.useState<any[]>([]);
  const [selectedCreativeManagerId, setSelectedCreativeManagerId] =
    React.useState<string>("");

  // BFF hook — fetches purchase authorities + creative managers in one request
  const {
    purchaseAuthorities: fetchedAuthorities,
    creativeManagers: fetchedManagers,
  } = useBrandCheckoutInit();

  // Sync BFF data into local state (preserves backward compatibility with existing handlers)
  React.useEffect(() => {
    if (fetchedAuthorities.length > 0)
      setPurchaseAuthorities(fetchedAuthorities);
  }, [fetchedAuthorities]);

  React.useEffect(() => {
    if (fetchedManagers.length > 0) setCreativeManagers(fetchedManagers);
  }, [fetchedManagers]);

  // Filter out hidden items for display - use useMemo to prevent infinite loops
  const visibleCartItems = React.useMemo(
    () =>
      cartItems.filter(
        (item) => !hiddenItemIds.includes(item.siteId || item._id),
      ),
    [cartItems, hiddenItemIds],
  );
  const [formData, setFormData] = React.useState({
    poNumber: "",
    globalCreativeLink: "",
    globalInstructions: "",
    notes: "",
    additionalCharges: [{ label: "", amount: "" }],
  });
  const [orderDate, setOrderDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [deadlineDate, setDeadlineDate] = React.useState<Date | undefined>();

  // Generate tender number when type changes to tender
  React.useEffect(() => {
    if (orderType === "tender" && !tenderNumber) {
      const timestamp = Date.now();
      setTenderNumber(`TND-${timestamp}`);
    }
  }, [orderType, tenderNumber]);

  // Update selected PO details when PO number changes
  React.useEffect(() => {
    if (formData.poNumber && purchaseAuthorities.length > 0) {
      const selectedPA = purchaseAuthorities.find(
        (pa) => pa.poNumber === formData.poNumber,
      );
      if (selectedPA) {
        setSelectedPODetails(selectedPA);
        // Auto-select vendor from PO when opening vendor modal
        if (selectedPA.vendorId) {
          // Store vendorId for auto-selection when modal opens
          setSelectedPODetails({
            ...selectedPA,
            autoSelectVendorId: selectedPA.vendorId,
          });
        }
      }
    } else {
      setSelectedPODetails(null);
    }
  }, [formData.poNumber, purchaseAuthorities]);

  // Auto-set deadline to 30 days after order date if not selected
  // React.useEffect(() => {
  //   if (orderDate && !deadlineDate) {
  //     setDeadlineDate(addDays(orderDate, 30));
  //   }
  // }, [orderDate]);

  // Get store details from first cart item
  React.useEffect(() => {
    const fetchStoreDetails = async () => {
      if (visibleCartItems.length > 0 && !selectedStore && accessToken) {
        const firstItem = visibleCartItems[0];
        const storeId = firstItem.storeId;

        if (storeId) {
          try {
            const response = await fetch(
              `/api/brand/stores/get?storeId=${storeId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );

            if (response.ok) {
              const data = await response.json();
              const store = data.stores?.[0];
              if (store) {
                setSelectedStore({
                  _id: store._id,
                  pincode: store.storePincode || firstItem.pincode || "400001",
                  location: store.storeLocation,
                });
              }
            } else {
              // Fallback if API fails
              setSelectedStore({
                _id: storeId,
                pincode: firstItem.pincode || "400001",
              });
            }
          } catch (error) {
            console.error("Error fetching store details:", error);
            // Fallback
            setSelectedStore({
              _id: storeId,
              pincode: firstItem.pincode || "400001",
            });
          }
        }
      }
    };

    fetchStoreDetails();
  }, [visibleCartItems, selectedStore, accessToken]);

  const totalAmount = visibleCartItems.reduce((total, item) => {
    const itemTotal = priceCalculatorNumber(item);
    return total + itemTotal;
  }, 0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCharge = () => {
    setFormData({
      ...formData,
      additionalCharges: [
        { label: "", amount: "" },
        ...formData.additionalCharges,
      ],
    });
  };

  const handleRemoveCharge = (index: number) => {
    const newCharges = formData.additionalCharges.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      additionalCharges:
        newCharges.length > 0 ? newCharges : [{ label: "", amount: "" }],
    });
  };

  const handleChargeChange = (
    index: number,
    field: "label" | "amount",
    value: string,
  ) => {
    const newCharges = [...formData.additionalCharges];
    newCharges[index][field] = value;
    setFormData({
      ...formData,
      additionalCharges: newCharges,
    });
  };

  const totalAdditionalCharges = formData.additionalCharges.reduce(
    (total, charge) => {
      const amount = parseFloat(charge.amount || "0");
      return total + amount;
    },
    0,
  );

  const totalWithTax = (totalAmount + totalAdditionalCharges) * 1.18;

  const handleUpdateQuantity = async (siteId: string, newQuantity: number) => {
    if (!accessToken || newQuantity < 1) return;

    try {
      const response = await fetch("/api/brand/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ siteId, quantity: newQuantity }),
      });

      if (response.ok) {
        dispatch(updateQuantity({ siteId, quantity: newQuantity }));
      } else {
        const data = await response.json();
        console.error("Failed to update quantity:", data);
        toast.error("Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleSubmitOrder = (
    e: React.FormEvent,
    submitType: "order" | "tender",
  ) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Please login to place order");
      return;
    }

    if (!orderDate) {
      toast.error("Please select order date");
      return;
    }

    if (visibleCartItems.length === 0) {
      toast.error("No items in cart");
      return;
    }

    if (!selectedStore?.pincode) {
      toast.error("Store information not available");
      return;
    }

    if (submitType === "order" && !formData.poNumber) {
      toast.error("Please select a PO Number");
      return;
    }

    // If tender, submit directly without vendor selection
    if (submitType === "tender") {
      handleTenderSubmission();
    } else {
      // For order, open vendor selection modal
      setPendingOrderType(submitType);
      setIsVendorModalOpen(true);
    }
  };

  const handleTenderSubmission = async () => {
    if (!accessToken || !selectedStore) return;

    setIsSubmitting(true);

    try {
      // Get unique store IDs from cart items
      const uniqueStoreIds = Array.from(
        new Set(visibleCartItems.map((item) => item.storeId).filter(Boolean)),
      );

      // Fetch store details for all unique store IDs
      const storeDetailsMap = new Map();
      for (const storeId of uniqueStoreIds) {
        try {
          const response = await fetch(
            `/api/brand/stores/get?storeId=${storeId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            const store = data.stores?.[0];
            if (store) {
              console.log(`Fetched store details for ${storeId}:`, {
                storeName: store.storeName,
                storeAddress: store.storeAddress,
                storeCity: store.storeCity,
              });
              storeDetailsMap.set(storeId, {
                storeAddress: store.storeAddress,
                storeLocation: store.storeLocation,
                storeCity: store.storeCity,
                storeState: store.storeState,
                storePincode: store.storePincode,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching store details for ${storeId}:`, error);
        }
      }

      // Prepare tender sites data with store location details
      const tenderSites = visibleCartItems.map((item) => {
        const storeDetails = storeDetailsMap.get(item.storeId) || {};

        // console.log(`Mapping site ${item.elementName} with storeId ${item.storeId}:`, storeDetails);

        return {
          siteId: item.siteId || item._id,
          elementName: item.elementName,
          siteDescription: item.siteDescription,
          storeName: item.storeName,
          storeId: item.storeId || "",
          photo: item.photo,
          width: parseFloat(item.width?.toString() || "0"),
          height: parseFloat(item.height?.toString() || "0"),
          measurementUnit: item.measurementUnit,
          rate: parseFloat(item.rate?.toString() || "0"),
          calculateUnit: item.calculateUnit,
          quantity: item.quantity,
          creativeLink: item.creativeLink || formData.globalCreativeLink,
          instructions: item.instructions,
          storeAddress: storeDetails.storeAddress,
          storeLocation: storeDetails.storeLocation,
          storeCity: storeDetails.storeCity,
          storeState: storeDetails.storeState,
          storePincode: storeDetails.storePincode,
        };
      });

      const subtotal = totalAmount;
      const additionalChargesTotal = totalAdditionalCharges;
      const tax = (subtotal + additionalChargesTotal) * 0.18;
      const total = subtotal + additionalChargesTotal + tax;

      // Filter out empty additional charges
      const validAdditionalCharges = formData.additionalCharges.filter(
        (charge) => charge.label.trim() !== "" && charge.amount.trim() !== "",
      );

      // Create tender payload
      const tenderPayload: any = {
        tenderNumber: tenderNumber,
        poNumber: "",
        tenderDate: orderDate!,
        deadlineDate: deadlineDate || addDays(orderDate!, 30),
        globalCreativeLink: formData.globalCreativeLink,
        notes: formData.notes,
        additionalCharges: validAdditionalCharges,
        sites: tenderSites,
        // storeId: visibleCartItems[0]?.storeId || selectedStore._id,
        // storeLocation: storeDetailsMap.get(visibleCartItems[0]?.storeId)?.storeLocation || selectedStore.location,
        subtotal,
        additionalChargesTotal,
        tax,
        total,
      };

      // Add creative managers if selected
      if (wantCreativeManagers && selectedCreativeManagerId) {
        tenderPayload.creativeManagerId = selectedCreativeManagerId;
      }

      // Submit tender
      const response = await fetch("/api/brand/tenders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(tenderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create tender");
      }

      const data = await response.json();

      toast.success("Tender submitted successfully!", {
        description: "Your tender has been submitted and is pending review.",
      });

      // Remove only tendered items from Redux cart
      const tenderedSiteIds = visibleCartItems.map(
        (item) => item.siteId || item._id,
      );
      dispatch(removeBulkItems(tenderedSiteIds));

      router.push("/brand/tenders");
    } catch (error: any) {
      console.error("Error submitting tender:", error);
      toast.error("Failed to submit tender", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVendorSelected = async (vendorId: string) => {
    if (!pendingOrderType || !accessToken || !selectedStore) return;

    setIsVendorModalOpen(false);
    setIsSubmitting(true);

    try {
      // Get unique store IDs from cart items
      const uniqueStoreIds = Array.from(
        new Set(visibleCartItems.map((item) => item.storeId).filter(Boolean)),
      );

      // Fetch store details for all unique store IDs
      const storeDetailsMap = new Map();
      for (const storeId of uniqueStoreIds) {
        try {
          const response = await fetch(
            `/api/brand/stores/get?storeId=${storeId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            const store = data.stores?.[0];
            if (store) {
              storeDetailsMap.set(storeId, {
                storeAddress: store.storeAddress,
                storeLocation: store.storeLocation,
                storeCity: store.storeCity,
                storeState: store.storeState,
                storePincode: store.storePincode,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching store details for ${storeId}:`, error);
        }
      }

      // Prepare order sites data with store location details
      const orderSites: OrderSite[] = visibleCartItems.map((item) => {
        const storeDetails = storeDetailsMap.get(item.storeId) || {};

        return {
          siteId: item.siteId || item._id,
          elementName: item.elementName,
          siteDescription: item.siteDescription,
          storeName: item.storeName,
          storeId: item.storeId || "",
          photo: item.photo,
          width: parseFloat(item.width?.toString() || "0"),
          height: parseFloat(item.height?.toString() || "0"),
          measurementUnit: item.measurementUnit,
          rate: parseFloat(item.rate?.toString() || "0"),
          calculateUnit: item.calculateUnit,
          quantity: item.quantity,
          creativeLink: item.creativeLink || formData.globalCreativeLink,
          instructions: item.instructions,
          storeAddress: storeDetails.storeAddress,
          storeLocation: storeDetails.storeLocation,
          storeCity: storeDetails.storeCity,
          storeState: storeDetails.storeState,
          storePincode: storeDetails.storePincode,
        };
      });

      const subtotal = totalAmount;
      const additionalChargesTotal = totalAdditionalCharges;
      const tax = (subtotal + additionalChargesTotal) * 0.18;
      const total = subtotal + additionalChargesTotal + tax;

      // Filter out empty additional charges
      const validAdditionalCharges = formData.additionalCharges.filter(
        (charge) => charge.label.trim() !== "" && charge.amount.trim() !== "",
      );

      // Create order payload
      const orderPayload: CreateOrderPayload = {
        orderNumber: "", // Will be set from server
        poNumber: formData.poNumber,
        orderDate: orderDate!,
        deadlineDate: deadlineDate || addDays(orderDate!, 30),
        orderType: pendingOrderType,
        globalCreativeLink: formData.globalCreativeLink,
        notes: formData.notes,
        additionalCharges: validAdditionalCharges,
        sites: orderSites,
        vendorId,
        // storeId: visibleCartItems[0]?.storeId || selectedStore._id,
        // storeLocation: storeDetailsMap.get(visibleCartItems[0]?.storeId)?.storeLocation || selectedStore.location,
        brandId: "", // Will be set from token in API
        subtotal,
        additionalChargesTotal,
        tax,
        total,
      };

      // Add creative managers if selected
      if (wantCreativeManagers && selectedCreativeManagerId) {
        orderPayload.creativeManagerId = selectedCreativeManagerId;
      }

      // Submit order
      const response = await fetch("/api/brand/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = await response.json();

      const orderTypeText = pendingOrderType === "tender" ? "Tender" : "Order";
      toast.success(`${orderTypeText} placed successfully!`, {
        description: `Your ${orderTypeText.toLowerCase()} has been submitted and is being processed.`,
      });

      // Remove only ordered items from Redux cart (not all items)
      const orderedSiteIds = visibleCartItems.map(
        (item) => item.siteId || item._id,
      );
      dispatch(removeBulkItems(orderedSiteIds));

      router.push("/brand/orders");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
      setPendingOrderType(null);
    }
  };

  if (visibleCartItems.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some sites to your cart to proceed with checkout.
          </p>
          <Button onClick={() => router.push("/brand/sites")}>
            Browse Sites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your order details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <OrderInformation
            orderType={orderType}
            setOrderType={setOrderType}
            orderDate={orderDate}
            setOrderDate={setOrderDate}
            deadlineDate={deadlineDate}
            setDeadlineDate={setDeadlineDate}
            formData={formData}
            setFormData={setFormData}
            purchaseAuthorities={purchaseAuthorities}
            tenderNumber={tenderNumber}
            handleInputChange={handleInputChange}
            wantCreativeManagers={wantCreativeManagers}
            setWantCreativeManagers={setWantCreativeManagers}
            creativeManagers={creativeManagers}
            selectedCreativeManagerId={selectedCreativeManagerId}
            setSelectedCreativeManagerId={setSelectedCreativeManagerId}
          />

          {/* Sites Management */}
          <OrderSites
            hiddenItemIds={hiddenItemIds}
            setHiddenItemIds={setHiddenItemIds}
          />

          {/* Additional Notes */}
          <AdditionalNotes
            formData={formData}
            handleInputChange={handleInputChange}
            handleAddCharge={handleAddCharge}
            handleRemoveCharge={handleRemoveCharge}
            handleChargeChange={handleChargeChange}
            orderType={orderType}
            isSubmitting={isSubmitting}
            handleSubmitOrder={handleSubmitOrder}
            totalAmount={totalAmount}
          />
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <OrderSummary
            visibleCartItems={visibleCartItems}
            totalAmount={totalAmount}
            totalAdditionalCharges={totalAdditionalCharges}
          />

          {/* PO Summary - Only for Order type */}
          {orderType === "order" && (
            <POSummary
              selectedPO={selectedPODetails}
              currentOrderTotal={totalWithTax}
            />
          )}
        </div>
      </div>

      {/* Vendor Selection Modal */}
      <VendorSelectionModal
        isOpen={isVendorModalOpen}
        onClose={() => {
          setIsVendorModalOpen(false);
          setPendingOrderType(null);
        }}
        onSelectVendor={handleVendorSelected}
        accessToken={accessToken}
        preSelectedVendorId={selectedPODetails?.vendorId}
      />
    </div>
  );
}
