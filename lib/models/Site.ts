import mongoose, { Schema, Document } from 'mongoose';

export interface ISite extends Document {
  storeId: mongoose.Types.ObjectId;
  raceeId: mongoose.Types.ObjectId;
  rateId: string;
  elementName: string;
  description: string;
  rateType: string;
  measurementUnit: string;
  calculateUnit: string;
  width: number;
  height: number;
  rate: number;
  photo: string;
  siteDescription?: string;
  createdAt: Date;
  approvedAt: Date;
}

const SiteSchema = new Schema<ISite>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    raceeId: {
      type: Schema.Types.ObjectId,
      ref: 'Racee',
      required: true,
    },
    rateId: {
      type: String,
      required: true,
    },
    elementName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rateType: {
      type: String,
      required: true,
    },
    measurementUnit: {
      type: String,
      required: true,
    },
    calculateUnit: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
    siteDescription: {
      type: String,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Site = mongoose.models.Site || mongoose.model<ISite>('Site', SiteSchema);

export default Site;
