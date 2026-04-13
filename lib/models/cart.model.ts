import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  siteId: string;
  elementName: string;
  siteDescription?: string;
  photo?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  addedAt: Date;
  storeId: string;
  storeName: string;
  storeLocation: { [key: string]: any };
  creativeLink?: string;
  instructions?: string;
}

export interface ICart extends Document {
  brandId: string;
  items: ICartItem[];
  updatedAt: Date;
}

const CartItemSchema = new Schema({
  siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
  elementName: { type: String, required: true },
  siteDescription: { type: String },
  photo: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  measurementUnit: { type: String, required: true },
  rate: { type: Number, required: true },
  calculateUnit: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  addedAt: { type: Date, default: Date.now },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  storeName: { type: String, required: true },
  storeLocation: { type: Object, required: true },
  creativeLink: { type: String },
  instructions: { type: String },
});

const CartSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, unique: true, index: true },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Cart ||
  mongoose.model<ICart>("Cart", CartSchema);
