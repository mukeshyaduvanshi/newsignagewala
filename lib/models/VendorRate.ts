import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendorRate extends Document {
  elementName: string;
  uniqueKey?: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width?: number;
  height?: number;
  rate: number;
  instruction?: string;
  imageUrl?: string;
  newElement: boolean;
  rateRejected: boolean;
  masterRateId?: mongoose.Types.ObjectId;
  canEditDescription: boolean;
  createdId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  isActive: boolean;
  isUsedInRates: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorRateSchema: Schema<IVendorRate> = new Schema(
  {
    elementName: {
      type: String,
      required: [true, "Element name is required"],
      trim: true,
      minlength: [2, "Element name must be at least 2 characters long"],
    },
    uniqueKey: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    rateType: {
      type: String,
      required: [true, "Rate type is required"],
      enum: ["fixed", "custom"],
      default: "custom",
    },
    measurementUnit: {
      type: String,
      required: [true, "Measurement unit is required"],
      enum: ["inch", "feet", "cm", "mm", "pcs", "runninginch", "runningfeet"],
      default: "inch",
    },
    calculateUnit: {
      type: String,
      required: [true, "Calculate unit is required"],
      enum: ["sqft", "sqin", "sqcm", "sqmm", "pc", "feet", "inch"],
      default: "sqft",
    },
    width: {
      type: Number,
      min: [0, "Width must be a positive number"],
    },
    height: {
      type: Number,
      min: [0, "Height must be a positive number"],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate must be a positive number"],
    },
    instruction: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    newElement: {
      type: Boolean,
      default: false,
    },
    rateRejected: {
      type: Boolean,
      default: false,
    },
    masterRateId: {
      type: Schema.Types.ObjectId,
      ref: "MasterRate",
    },
    canEditDescription: {
      type: Boolean,
      default: false,
    },
    createdId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created ID is required"],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isUsedInRates: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
VendorRateSchema.index({ createdId: 1, isActive: 1 });
VendorRateSchema.index({ parentId: 1, isActive: 1 });
VendorRateSchema.index({ elementName: 1 });
VendorRateSchema.index({ masterRateId: 1 });

const VendorRate: Model<IVendorRate> =
  mongoose.models.VendorRate || mongoose.model<IVendorRate>("VendorRate", VendorRateSchema);

export default VendorRate;
