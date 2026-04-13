import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStoreAssignManager extends Document {
  storeId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  managerUserId: mongoose.Types.ObjectId;
  isStoreUsed: boolean;
  raceeIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const StoreAssignManagerSchema: Schema<IStoreAssignManager> = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      required: [true, "Team member ID is required"],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent ID (brand) is required"],
    },
    managerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Manager user ID is required"],
    },
    isStoreUsed: {
      type: Boolean,
      default: false,
    },
    raceeIds: [{
      type: Schema.Types.ObjectId,
      ref: "Racee",
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate assignments
StoreAssignManagerSchema.index({ storeId: 1, teamId: 1 }, { unique: true });

// Index for quick lookups
StoreAssignManagerSchema.index({ parentId: 1, isStoreUsed: 1 });
StoreAssignManagerSchema.index({ storeId: 1 });
StoreAssignManagerSchema.index({ managerUserId: 1 });

// Prevent model recompilation in development
const StoreAssignManager: Model<IStoreAssignManager> =
  mongoose.models.StoreAssignManager ||
  mongoose.model<IStoreAssignManager>("StoreAssignManager", StoreAssignManagerSchema);

export default StoreAssignManager;
