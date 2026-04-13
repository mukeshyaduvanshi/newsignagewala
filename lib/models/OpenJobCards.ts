import mongoose, { Schema, Document, Model } from "mongoose";

interface ISite {
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
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  status?: string;
}

interface IOpenJobCard extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  jobCardNumber: number;
  orderDate: Date;
  deadlineDate: Date;
  globalCreativeLink?: string;
  notes?: string;
  orderStatus: string;
  sites: ISite[];
  createdAt: Date;
}

const SiteSchema = new Schema<ISite>({
  siteId: { type: Schema.Types.ObjectId, ref: "Site" },
  elementName: { type: String },
  siteDescription: { type: String },
  storeName: { type: String },
  storeId: { type: Schema.Types.ObjectId, ref: "Store" },
  photo: { type: String },
  width: { type: Number },
  height: { type: Number },
  measurementUnit: { type: String },
  rate: { type: Number },
  calculateUnit: { type: String },
  quantity: { type: Number },
  creativeLink: { type: String },
  instructions: { type: String },
  storeLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  status: {
    type: String,
    enum: ['pending', 'printed'],
    default: 'pending',
  },
}, { _id: false });

const OpenJobCardsSchema = new Schema<IOpenJobCard>({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  orderNumber: { type: String, required: true },
  jobCardNumber: { type: Number, required: true },
  orderDate: { type: Date, required: true },
  deadlineDate: { type: Date, required: true },
  globalCreativeLink: { type: String },
  notes: { type: String },
  orderStatus: { type: String, required: true },
  sites: [SiteSchema],
  createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to force reload with updated schema
if (mongoose.models.OpenJobCards) {
  delete mongoose.models.OpenJobCards;
}

const OpenJobCards: Model<IOpenJobCard> = mongoose.model<IOpenJobCard>(
  "OpenJobCards",
  OpenJobCardsSchema
);

export default OpenJobCards;
