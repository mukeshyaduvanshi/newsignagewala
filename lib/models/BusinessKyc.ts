import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IBusinessKyc extends Document {
  parentId: mongoose.Types.ObjectId;
  hasGST: boolean;
  gstNumber?: string;
  aadharNumber?: string;
  cinNumber?: string;
  msmeNumber?: string;
  verifiedDocuments?: {
    gst?: {
      number: string;
      verified: boolean;
      verifiedAt: Date;
      verifiedBy: mongoose.Types.ObjectId;
      data: any;
    };
    cin?: {
      number: string;
      verified: boolean;
      verifiedAt: Date;
      verifiedBy: mongoose.Types.ObjectId;
      data: any;
    };
    msme?: {
      number: string;
      verified: boolean;
      verifiedAt: Date;
      verifiedBy: mongoose.Types.ObjectId;
      data: any;
    };
  };
  adminVerified?: boolean;
  adminVerifiedAt?: Date;
  adminVerifiedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessKycSchema = new Schema<IBusinessKyc>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    hasGST: {
      type: Boolean,
      required: true,
      default: true,
    },
    gstNumber: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    aadharNumber: {
      type: String,
      default: null,
      trim: true,
    },
    cinNumber: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    msmeNumber: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    verifiedDocuments: {
      type: Schema.Types.Mixed,
      default: {},
    },
    adminVerified: {
      type: Boolean,
      default: false,
    },
    adminVerifiedAt: {
      type: Date,
      default: null,
    },
    adminVerifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const BusinessKyc = models.BusinessKyc || model<IBusinessKyc>('BusinessKyc', BusinessKycSchema);

export default BusinessKyc;
