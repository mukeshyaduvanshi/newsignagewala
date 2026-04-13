import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStoreAuthority extends Document {
  selectedOptions: string[];
  uniqueKeys: string[];
  createdId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  isActive: boolean;
  isUsedInStore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreAuthoritySchema: Schema<IStoreAuthority> = new Schema(
  {
    selectedOptions: {
      type: [String],
      required: [true, "Selected options are required"],
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one option must be selected"
      }
    },
    uniqueKeys: {
      type: [String],
      default: [],
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
    isUsedInStore: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const StoreAuthority: Model<IStoreAuthority> =
  mongoose.models.StoreAuthority ||
  mongoose.model<IStoreAuthority>("StoreAuthority", StoreAuthoritySchema);

export default StoreAuthority;
