import mongoose, { Schema, Document, Model } from "mongoose";

interface IAdditionalCharge {
  label: string;
  amount: string;
}

interface ISiteChange {
  siteIndex: number;
  elementName: string;
  oldRate: number;
  newRate: number;
  storeName: string;
}

interface IAdditionalChargeChange {
  chargeIndex: number;
  chargeName: string;
  oldAmount: number;
  newAmount: number;
}

interface IPriceEscalation {
  raisedAt: Date;
  raisedBy: mongoose.Types.ObjectId;
  userType: "vendor" | "brand";
  siteChanges: ISiteChange[];
  additionalChargeChanges: IAdditionalChargeChange[];
  oldTotal: number;
  newTotal: number;
  totalDifference: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
}

interface IInstaller {
  name: string;
  phone: string;
  capturedAt?: Date;
}

interface IOrderSite {
  siteId: mongoose.Types.ObjectId;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: mongoose.Types.ObjectId;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  photo?: string;
  oldPhoto?: string;
  creativeAdaptive?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  capturedImages?: string[];
  installers?: IInstaller[];
  referenceStatus?: "pending" | "modified" | "verified";
  status?: string;
  rejectionRemarks?: string;
  rejectionStatus?: string;
  rejectedAt?: Date;
}

interface IOrder extends Document {
  brandId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  creativeManagerId?: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
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
  additionalCharges: IAdditionalCharge[];
  sites: IOrderSite[];
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
    | "installed"
    | "creativeAdapted"
    | "creativeaddepted";
  priceEscalation?: IPriceEscalation[];
  openjobcardsId?: mongoose.Types.ObjectId;
  installCertificateId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdditionalChargeSchema = new Schema<IAdditionalCharge>({
  label: { type: String, required: true },
  amount: { type: String, required: true },
});

const SiteChangeSchema = new Schema<ISiteChange>({
  siteIndex: { type: Number, required: true },
  elementName: { type: String, required: true },
  storeName: { type: String, required: true },
  oldRate: { type: Number, required: true },
  newRate: { type: Number, required: true },
});

const AdditionalChargeChangeSchema = new Schema<IAdditionalChargeChange>({
  chargeIndex: { type: Number, required: true },
  chargeName: { type: String, required: true },
  oldAmount: { type: Number, required: true },
  newAmount: { type: Number, required: true },
});

const PriceEscalationSchema = new Schema<IPriceEscalation>({
  raisedAt: { type: Date, required: true },
  raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userType: { type: String, enum: ["vendor", "brand"], required: true },
  siteChanges: [SiteChangeSchema],
  additionalChargeChanges: [AdditionalChargeChangeSchema],
  oldTotal: { type: Number, required: true },
  newTotal: { type: Number, required: true },
  totalDifference: { type: Number, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

const InstallerSchema = new Schema<IInstaller>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const OrderSiteSchema = new Schema<IOrderSite>({
  siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
  elementName: { type: String, required: true },
  siteDescription: { type: String },
  storeName: { type: String, required: true },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  storeLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  photo: { type: String },
  oldPhoto: { type: String },
  creativeAdaptive: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  measurementUnit: { type: String, required: true },
  rate: { type: Number, required: true },
  calculateUnit: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  creativeLink: { type: String },
  instructions: { type: String },
  capturedImages: { type: [String], default: [] },
  installers: { type: [InstallerSchema], default: [] },
  referenceStatus: {
    type: String,
    enum: ["pending", "modified", "verified"],
    default: "pending",
  },
  status: { type: String },
  rejectionRemarks: { type: String },
  rejectionStatus: { type: String },
  rejectedAt: { type: Date },
});

const OrderSchema = new Schema<IOrder>(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creativeManagerId: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    // storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    // storeLocation: {
    //   type: {
    //     type: String,
    //     enum: ["Point"],
    //   },
    //   coordinates: {
    //     type: [Number],
    //   },
    // },
    orderNumber: { type: String, required: true },
    poNumber: { type: String },
    orderDate: { type: Date, required: true },
    deadlineDate: { type: Date, required: true },
    orderType: { type: String, enum: ["order", "tender"], required: true },
    globalCreativeLink: { type: String },
    notes: { type: String },
    additionalCharges: [AdditionalChargeSchema],
    sites: [OrderSiteSchema],
    subtotal: { type: Number, required: true, default: 0 },
    additionalChargesTotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    orderStatus: {
      type: String,
      enum: [
        "new",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "accepted",
        "rejected",
        "escalation",
        "installed",
        "creativeAdapted",
        "creativeaddepted",
      ],
      default: "new",
    },
    priceEscalation: [PriceEscalationSchema],
    openjobcardsId: { type: Schema.Types.ObjectId, ref: "OpenJobCards" },
    installCertificateId: {
      type: Schema.Types.ObjectId,
      ref: "InstallationCertificate",
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
OrderSchema.index({ brandId: 1, createdAt: -1 });
OrderSchema.index({ vendorId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });

// Delete the model if it exists to force reload with updated schema
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
