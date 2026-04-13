import useSWR from "swr";

interface Site {
  _id: string;
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  photo?: string;
  creativeAdaptive?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  status?: string;
}

export interface OpenJobCard {
  _id: string;
  orderNumber: string;
  orderDate: Date;
  deadlineDate: Date;
  globalCreativeLink?: string;
  notes?: string;
  orderStatus: string;
  sites: Site[];
  createdAt: Date;
}

interface OpenJobCardResponse {
  success: boolean;
  data: OpenJobCard;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch job card");
  }

  return response.json();
};

export function useOpenJobCard(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<OpenJobCardResponse>(
    id ? `/api/openjobcards/${id}` : null,
    fetcher,
  );

  return {
    jobCard: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
