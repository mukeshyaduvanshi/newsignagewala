import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IBusinessDetails extends Document {
  parentId: mongoose.Types.ObjectId;
  companyName: string;
  companyType: string;
  companyLogo?: string;
  companyProfile?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessDetailsSchema = new Schema<IBusinessDetails>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyType: {
      type: String,
      required: true,
      enum: ['pvt_ltd', 'public_ltd', 'llp', 'partnership', 'sole_proprietorship', 'trust', 'society', 'other'],
    },
    companyLogo: {
      type: String,
      default: null,
    },
    companyProfile: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const BusinessDetails = models.BusinessDetails || model<IBusinessDetails>('BusinessDetails', BusinessDetailsSchema);

export default BusinessDetails;
