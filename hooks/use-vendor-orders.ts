import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

export interface OrderSite {
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: string;
  photo?: string;
  creativeAdaptive?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  status?: string;
  rejectionRemarks?: string;
  rejectionStatus?: string;
  rejectedAt?: Date;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
}

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

interface PriceEscalation {
  raisedAt: Date;
  raisedBy: string;
  userType: "vendor" | "brand";
  siteChanges: SiteChange[];
  additionalChargeChanges: AdditionalChargeChange[];
  oldTotal: number;
  newTotal: number;
  totalDifference: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
}

export interface VendorOrder {
  _id: string;
  brandId: {
    _id: string;
    companyName: string;
    email: string;
    phone: string;
  };
  vendorId: string;
  storeId?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  orderNumber: string;
  poNumber?: string;
  orderDate: Date;
  deadlineDate: Date;
  orderType: "order" | "tender";
  globalCreativeLink?: string;
  notes?: string;
  sites: OrderSite[];
  subtotal: number;
  additionalChargesTotal: number;
  tax: number;
  total: number;
  orderStatus:
    | "new"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "accepted"
    | "rejected"
    | "escalation"
    | "installed";
  priceEscalation?: PriceEscalation[];
  openjobcardsId?: string;
  installCertificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VendorOrdersResponse {
  orders: VendorOrder[];
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }

  return response.json();
};

export function useVendorOrders() {
  const { accessToken } = useAuth();

  const url = `/api/vendor/orders`;

  // Use SWR for data fetching with revalidation
  const { data, error, isLoading, mutate } = useSWR<VendorOrdersResponse>(
    accessToken ? [url, accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    },
  );

  return {
    orders: data?.orders || [],
    isLoading,
    isError: error,
    mutate,
  };
}
