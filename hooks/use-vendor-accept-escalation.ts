"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

export function useVendorAcceptEscalation() {
  const { accessToken } = useAuth();
  const [isAcceptingEscalation, setIsAcceptingEscalation] = useState(false);

  const acceptEscalation = async (orderId: string, finalSites?: any[], finalAdditionalCharges?: number): Promise<boolean> => {
    if (!accessToken) {
      toast.error("You must be logged in");
      return false;
    }

    setIsAcceptingEscalation(true);

    try {
      const response = await fetch("/api/vendor/orders/accept-escalation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, finalSites, finalAdditionalCharges }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to accept escalation");
        return false;
      }

      const diff = data.order.difference;
      const diffText = diff > 0 
        ? `(+₹${diff.toFixed(2)})` 
        : diff < 0 
        ? `(-₹${Math.abs(diff).toFixed(2)})` 
        : "(No change)";
      
      toast.success(`Escalation accepted ${diffText}`);
      return true;
    } catch (error) {
      console.error("Error accepting escalation:", error);
      toast.error("An error occurred while accepting escalation");
      return false;
    } finally {
      setIsAcceptingEscalation(false);
    }
  };

  return {
    acceptEscalation,
    isAcceptingEscalation,
  };
}
