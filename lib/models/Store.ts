import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStore extends Document {
  storeName: string;  uniqueKey: string;  storePhone: string;
  storeAddress: string;
  storeCountry: string;
  storeState: string;
  storeCity: string;
  storePincode: string;
  storeImage?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  createdId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema: Schema<IStore> = new Schema(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      minlength: [2, "Store name must be at least 2 characters long"],
    },
    uniqueKey: {
      type: String,
      required: [true, "Unique key is required"],
      trim: true,
      unique: true,
      minlength: [2, "Unique key must be at least 2 characters long"],
    },
    storePhone: {
      type: String,
      required: [true, "Store phone is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    storeAddress: {
      type: String,
      required: [true, "Store address is required"],
      trim: true,
      minlength: [10, "Address must be at least 10 characters long"],
    },
    storeCountry: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    storeState: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    storeCity: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    storePincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^[0-9]{6}$/, "Please enter a valid 6-digit pincode"],
    },
    storeImage: {
      type: String,
      default: "",
    },
    storeLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    createdId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
StoreSchema.index({ parentId: 1, isActive: 1 });
StoreSchema.index({ storePincode: 1 });
StoreSchema.index({ storeCountry: 1, storeState: 1, storeCity: 1 });

const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

export default Store;
