import useSWR from 'swr';

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
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  status?: 'pending' | 'installed';
  capturedImages?: string[];
  installers?: Array<{
    name: string;
    phone: string;
    capturedAt: Date;
  }>;
}

interface InstallationCertificate {
  _id: string;
  orderNumber: string;
  orderDate: string;
  deadlineDate: string;
  orderStatus: string;
  sites: Site[];
  createdAt: string;
}

interface InstallationCertificateResponse {
  success: boolean;
  data: InstallationCertificate;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useInstallationCertificate(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<InstallationCertificateResponse>(
    id ? `/api/installcertificates/${id}` : null,
    fetcher
  );

  return {
    certificate: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
