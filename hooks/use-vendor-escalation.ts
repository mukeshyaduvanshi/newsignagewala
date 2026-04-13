"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface SiteChange {
  siteIndex: number;
  elementName: string;
  oldRate: number;
  newRate: number;
  storeName: string;
}

interface AdditionalChargeChange {
  chargeIndex: number;
  chargeName: string;
  oldAmount: number;
  newAmount: number;
}

interface EscalationData {
  orderId: string;
  siteChanges: SiteChange[];
  additionalChargeChanges: AdditionalChargeChange[];
  oldTotal: number;
  newTotal: number;
  reason?: string;
}

export function useVendorEscalation() {
  const [isEscalating, setIsEscalating] = useState(false);
  const { accessToken } = useAuth();

  const raiseEscalation = async (escalationData: EscalationData): Promise<boolean> => {
    setIsEscalating(true);
    try {
      const response = await fetch("/api/vendor/orders/raise-escalation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(escalationData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to raise escalation");
        return false;
      }

      toast.success("Price escalation raised successfully");
      return true;
    } catch (error) {
      console.error("Error raising escalation:", error);
      toast.error("Failed to raise escalation");
      return false;
    } finally {
      setIsEscalating(false);
    }
  };

  return {
    raiseEscalation,
    isEscalating,
  };
}
