import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMasterRate extends Document {
  labelName: string;
  uniqueKey: string;
  description: string;
  rate: number;
  measurementUnit: string;
  calculateUnit: string;
  rateType: string;
  width?: number;
  height?: number;
  imageUrl?: string;
  createdId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  isActive: boolean;
  isUsedInRates: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MasterRateSchema: Schema<IMasterRate> = new Schema(
  {
    labelName: {
      type: String,
      required: [true, "Label name is required"],
      trim: true,
      minlength: [2, "Label name must be at least 2 characters long"],
    },
    uniqueKey: {
      type: String,
      required: [true, "Unique key is required"],
      trim: true,
      unique: true,
      minlength: [2, "Unique key must be at least 2 characters long"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate must be a positive number"],
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
    rateType: {
      type: String,
      required: [true, "Rate type is required"],
      enum: ["fixed", "custom"],
      default: "custom",
    },
    width: {
      type: Number,
      min: [0, "Width must be a positive number"],
    },
    height: {
      type: Number,
      min: [0, "Height must be a positive number"],
    },
    imageUrl: {
      type: String,
      trim: true,
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
  }
);

// Prevent model recompilation in development
const MasterRate: Model<IMasterRate> =
  mongoose.models.MasterRate ||
  mongoose.model<IMasterRate>("MasterRate", MasterRateSchema);

export default MasterRate;
