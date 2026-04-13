import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchaseAuthority extends Document {
  poNumber: string;
  brandId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  vendorName: string;
  issueDate: Date;
  expiryDate: Date;
  amount: number;
  usedAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseAuthoritySchema: Schema<IPurchaseAuthority> = new Schema(
  {
    poNumber: {
      type: String,
      required: [true, "PO Number is required"],
      trim: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be greater than 0"],
    },
    usedAmount: {
      type: Number,
      default: 0,
      min: [0, "Used amount cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
PurchaseAuthoritySchema.index({ brandId: 1, isActive: 1 });
PurchaseAuthoritySchema.index({ vendorId: 1 });
PurchaseAuthoritySchema.index({ poNumber: 1 }, { unique: true });

const PurchaseAuthority: Model<IPurchaseAuthority> =
  mongoose.models.PurchaseAuthority ||
  mongoose.model<IPurchaseAuthority>(
    "PurchaseAuthority",
    PurchaseAuthoritySchema,
  );

export default PurchaseAuthority;
