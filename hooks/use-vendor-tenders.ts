import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { fetchWithRetry } from "@/lib/utils/api-retry";

export interface VendorBidding {
  vendorId: string;
  amount?: number;
  customRates?: Array<{
    siteId: string;
    elementName: string;
    vendorRate: number;
  }>;
  vendorCharges?: Array<{
    label: string;
    amount: string;
  }>;
  status: "submitted" | "rejected";
  submittedAt: string;
}

export interface TenderSite {
  _id?: string;
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  photo?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  storeAddress?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  storeCity?: string;
  storeState?: string;
  storePincode?: string;
  vendorRate?: number;
}

export interface VendorTender {
  _id: string;
  tenderNumber: string;
  poNumber?: string;
  tenderDate: string;
  deadlineDate: string;
  totalSites: number;
  total: number;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  sites?: TenderSite[];
  subtotal?: number;
  tax?: number;
  additionalCharges?: Array<{
    label: string;
    amount: string;
  }>;
  additionalChargesTotal?: number;
  notes?: string;
  acceptedVendorId?: string;
  vendorBidding: VendorBidding | null;
}

export function useVendorTenders() {
  const { accessToken } = useAuth();
  const [tenders, setTenders] = useState<VendorTender[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenders = async () => {
    try {
      setIsLoading(true);

      if (!accessToken) {
        console.log("No access token available");
        setIsLoading(false);
        return;
      }

      console.log("Fetching tenders with token...");
      const response = await fetchWithRetry("/api/vendor/tenders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch tenders");
      }

      const data = await response.json();
      console.log("Vendor Tenders API Response:", data);
      console.log("Tenders Count:", data.tenders?.length || 0);
      setTenders(data.tenders || []);
    } catch (error) {
      console.error("Error fetching tenders:", error);
      toast.error("Failed to load tenders");
    } finally {
      setIsLoading(false);
    }
  };

  const submitBid = async (
    tenderId: string,
    amount?: number,
    customRates?: Array<{
      siteId: string;
      elementName: string;
      vendorRate: number;
    }>,
    vendorCharges?: Array<{ label: string; amount: string }>,
  ) => {
    try {
      if (!accessToken) {
        toast.error("Please login to continue");
        return false;
      }

      const response = await fetch("/api/vendor/tenders/submit-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tenderId, amount, customRates, vendorCharges }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit bid");
        return false;
      }

      toast.success("Bid submitted successfully");
      await fetchTenders();
      return true;
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast.error("Failed to submit bid");
      return false;
    }
  };

  const rejectBid = async (tenderId: string) => {
    try {
      if (!accessToken) {
        toast.error("Please login to continue");
        return false;
      }

      const response = await fetch("/api/vendor/tenders/reject-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tenderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to reject bid");
        return false;
      }

      toast.success("Bid rejected successfully");
      await fetchTenders();
      return true;
    } catch (error) {
      console.error("Error rejecting bid:", error);
      toast.error("Failed to reject bid");
      return false;
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    fetchTenders();

    const sseUrl = `/api/vendor/tenders/sse?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(sseUrl);

    es.addEventListener("update", () => {
      fetchTenders();
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [accessToken]);

  return {
    tenders,
    isLoading,
    submitBid,
    rejectBid,
    refetch: fetchTenders,
  };
}
