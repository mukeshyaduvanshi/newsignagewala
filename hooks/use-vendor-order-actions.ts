"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

export function useVendorOrderActions() {
  const { accessToken } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const acceptOrder = async (orderId: string) => {
    if (!accessToken) {
      toast.error("Authentication required");
      return false;
    }

    setIsAccepting(true);
    try {
      const response = await fetch("/api/vendor/orders/accept-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept order");
      }

      toast.success("Order accepted successfully!", {
        description: "The order status has been updated to accepted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error accepting order:", error);
      toast.error(error.message || "Failed to accept order");
      return false;
    } finally {
      setIsAccepting(false);
    }
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    if (!accessToken) {
      toast.error("Authentication required");
      return false;
    }

    setIsRejecting(true);
    try {
      const response = await fetch("/api/vendor/orders/reject-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject order");
      }

      toast.success("Order rejected successfully!", {
        description: "The order has been rejected.",
      });

      return true;
    } catch (error: any) {
      console.error("Error rejecting order:", error);
      toast.error(error.message || "Failed to reject order");
      return false;
    } finally {
      setIsRejecting(false);
    }
  };

  return {
    acceptOrder,
    rejectOrder,
    isAccepting,
    isRejecting,
  };
}
