// Store types
export interface Store {
  _id: string;
  storeName: string;
  uniqueKey: string;
  storePhone: string;
  storeAddress: string;
  storeCountry: string;
  storeState: string;
  storeCity: string;
  storePincode: string;
  storeImage?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  createdId: string;
  parentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreFormData {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeCountry: string;
  storeState: string;
  storeCity: string;
  storePincode: string;
  storeImage?: string;
}

export interface StoreEditData extends StoreFormData {
  _id: string;
}

export interface PincodeData {
  country: string;
  state: string;
  city: string;
}

// Country/State/City data
export interface CountryOption {
  name: string;
  code: string;
}

export interface StateOption {
  name: string;
  code: string;
}

export interface CityOption {
  name: string;
}
