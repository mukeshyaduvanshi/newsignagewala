import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

export interface OpenJobCardSite {
  siteId?: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId?: string;
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
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
}

export interface OpenJobCardData {
  _id: string;
  orderId: string;
  orderNumber: string;
  jobCardNumber: number;
  orderDate: string;
  deadlineDate: string;
  globalCreativeLink: string;
  notes: string;
  orderStatus: string;
  sites: OpenJobCardSite[];
  createdAt: string;
}

export interface OpenJobCardsResponse {
  success: boolean;
  jobCards: OpenJobCardData[];
  message?: string;
}

const fetcher = async (
  url: string,
  token: string,
): Promise<OpenJobCardsResponse> => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch job cards");
  }

  return response.json();
};

export function useOrderJobCards(orderId: string | null) {
  const { accessToken } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<OpenJobCardsResponse>(
    orderId && accessToken
      ? [`/api/vendor/orders/openjobcards/${orderId}`, accessToken]
      : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    jobCards: data?.jobCards || [],
    isLoading,
    isError: error,
    mutate,
  };
}
