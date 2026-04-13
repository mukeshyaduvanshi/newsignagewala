export interface Installer {
  name: string;
  phone: string;
  capturedAt?: Date;
}

export interface OrderSite {
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: string;
  photo?: string;
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
  capturedImages?: string[];
  installers?: Installer[];
}

export interface AdditionalCharge {
  label: string;
  amount: string;
}

export interface CreateOrderPayload {
  orderNumber: string;
  poNumber: string;
  orderDate: Date;
  deadlineDate: Date;
  orderType: "order" | "tender";
  globalCreativeLink?: string;
  notes?: string;
  additionalCharges: AdditionalCharge[];
  sites: OrderSite[];
  vendorId: string;
  creativeManagerId?: string;
  // storeId: string;
  // storeLocation?: {
  //   type: string;
  //   coordinates: number[];
  // };
  brandId: string;
  subtotal: number;
  additionalChargesTotal: number;
  tax: number;
  total: number;
}

export interface Order extends CreateOrderPayload {
  _id: string;
  orderStatus: "new" | "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "accepted" | "rejected" | "escalation" | "installed" | "creativeaddepted";
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  address: string;
}
