import useSWR from "swr";
import { useAuth } from "@/lib/context/AuthContext";

export interface InstallerInfo {
  name: string;
  phone: string;
  remarks: string;
  capturedAt?: Date | string;
}

export interface InstallCertSite {
  siteId?: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId?: string;
  photo?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  status?: string;
  capturedImages?: string[];
  installers?: InstallerInfo[];
}

export interface InstallCertData {
  _id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  deadlineDate: string;
  globalCreativeLink: string;
  notes: string;
  orderStatus: string;
  sites: InstallCertSite[];
  createdAt: string;
}

export interface InstallCertsResponse {
  success: boolean;
  installCertificates: InstallCertData[];
  message?: string;
}

const fetcher = async (url: string, token: string): Promise<InstallCertsResponse> => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch installation certificates");
  }

  return response.json();
};

export function useOrderInstallCerts(orderId: string | null) {
  const { accessToken } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<InstallCertsResponse>(
    orderId && accessToken
      ? [`/api/vendor/orders/installcertificates/${orderId}`, accessToken]
      : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    installCerts: data?.installCertificates || [],
    isLoading,
    isError: error,
    mutate,
  };
}
