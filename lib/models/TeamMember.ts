import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember extends Document {
  parentId: mongoose.Types.ObjectId; // Brand user ID
  uniqueKey: string; // From UserRole (regionalManager, zonalManager, storeManager)
  userId: mongoose.Types.ObjectId; // Reference to User collection
  name: string; // Manager name
  email: string; // Manager email
  phone: string; // Manager phone
  managerType: string; // regionalManager, zonalManager, storeManager
  canChangeType: boolean; // Can brand change manager type
  createdBy?: mongoose.Types.ObjectId; // Admin who assigned this manager
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema: Schema<ITeamMember> = new Schema(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent ID is required"],
    },
    uniqueKey: {
      type: String,
      required: [true, "Unique key is required"],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    managerType: {
      type: String,
      required: [true, "Manager type is required"],
      trim: true,
    },
    canChangeType: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient queries
TeamMemberSchema.index({ parentId: 1, uniqueKey: 1, status: 1 });

// Compound unique index to prevent same user being added twice under same parent
TeamMemberSchema.index({ parentId: 1, userId: 1 }, { unique: true });

// Prevent model recompilation in development
const TeamMember: Model<ITeamMember> =
  mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);

export default TeamMember;
