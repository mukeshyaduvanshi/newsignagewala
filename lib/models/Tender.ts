import mongoose, { Schema, Document, Model } from "mongoose";

interface IAdditionalCharge {
  label: string;
  amount: string;
}

interface ITenderSite {
  siteId: mongoose.Types.ObjectId;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: mongoose.Types.ObjectId;
  photo?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  storeAddress?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  storeCity?: string;
  storeState?: string;
  storePincode?: string;
}

interface ICustomRate {
  siteId: string;
  elementName: string;
  vendorRate: number;
}

interface IVendorCharge {
  label: string;
  amount: string;
}

interface IBidding {
  vendorId: mongoose.Types.ObjectId;
  amount?: number;
  customRates?: ICustomRate[];
  vendorCharges?: IVendorCharge[];
  status: "submitted" | "rejected";
  submittedAt: Date;
}

interface ITender extends Document {
  brandId: mongoose.Types.ObjectId;
  creativeManagerId?: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  tenderNumber: string;
  poNumber?: string;
  tenderDate: Date;
  deadlineDate: Date;
  globalCreativeLink?: string;
  notes?: string;
  additionalCharges: IAdditionalCharge[];
  sites: ITenderSite[];
  subtotal: number;
  additionalChargesTotal: number;
  tax: number;
  total: number;
  originalSubtotal?: number;
  originalTax?: number;
  originalTotal?: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  biddings: IBidding[];
  acceptedVendorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdditionalChargeSchema = new Schema<IAdditionalCharge>({
  label: { type: String, required: true },
  amount: { type: String, required: true },
});

const TenderSiteSchema = new Schema<ITenderSite>({
  siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
  elementName: { type: String, required: true },
  siteDescription: { type: String },
  storeName: { type: String, required: true },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  photo: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  measurementUnit: { type: String, required: true },
  rate: { type: Number, required: true },
  calculateUnit: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  creativeLink: { type: String },
  instructions: { type: String },
  storeAddress: { type: String },
  storeLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  storeCity: { type: String },
  storeState: { type: String },
  storePincode: { type: String },
});

const CustomRateSchema = new Schema({
  siteId: { type: String, required: true },
  elementName: { type: String, required: true },
  vendorRate: { type: Number, required: true },
});

const VendorChargeSchema = new Schema({
  label: { type: String, required: true },
  amount: { type: String, required: true },
});

const BiddingSchema = new Schema<IBidding>({
  vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number },
  customRates: [CustomRateSchema],
  vendorCharges: [VendorChargeSchema],
  status: { 
    type: String, 
    enum: ["submitted", "rejected"], 
    required: true 
  },
  submittedAt: { type: Date, default: Date.now },
});

const TenderSchema = new Schema<ITender>(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
    tenderNumber: { type: String, required: true },
    poNumber: { type: String },
    tenderDate: { type: Date, required: true },
    deadlineDate: { type: Date, required: true },
    globalCreativeLink: { type: String },
    notes: { type: String },
    additionalCharges: [AdditionalChargeSchema],
    sites: [TenderSiteSchema],
    subtotal: { type: Number, required: true, default: 0 },
    additionalChargesTotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    originalSubtotal: { type: Number },
    originalTax: { type: Number },
    originalTotal: { type: Number },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    biddings: [BiddingSchema],
    acceptedVendorId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
TenderSchema.index({ brandId: 1, createdAt: -1 });
TenderSchema.index({ status: 1 });
TenderSchema.index({ tenderNumber: 1 }, { unique: true });

const Tender: Model<ITender> =
  mongoose.models.Tender || mongoose.model<ITender>("Tender", TenderSchema);

export default Tender;
