export interface Racee {
  _id: string;
  storeId: {
    _id: string;
    storeName: string;
    storeImage?: string;
    storeAddress: string;
    storeCity: string;
    storeState: string;
    storePincode: string;
    storeCountry?: string;
    parentId?: string;
    location?: {
      type: string;
      coordinates: number[];
    };
  } | string;
  storeName: string;
  managerUserId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | string;
  managerName: string;
  teamId: {
    _id: string;
    name: string;
    managerType: string;
    uniqueKey: string;
  } | string;
  parentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  newStorePhoto?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  sites?: {
    _id?: string;
    rateId: string;
    elementName: string;
    uniqueKey: string;
    description?: string;
    rateType: 'fixed' | 'custom';
    measurementUnit: string;
    calculateUnit: string;
    width: number;
    height: number;
    rate: number;
    photo: string;
    location: {
      type: string;
      coordinates: number[];
    };
    createdAt: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRaceePayload {
  storeIds: string[];
  managerUserId: string;
  notes?: string;
}
