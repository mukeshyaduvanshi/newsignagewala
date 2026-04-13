import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserRole extends Document {
  labelName: string;
  uniqueKey: string;
  description: string;
  createdId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  isActive: boolean;
  isUsedInTeam: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserRoleSchema: Schema<IUserRole> = new Schema(
  {
    labelName: {
      type: String,
      required: [true, "Label name is required"],
      trim: true,
      minlength: [2, "Label name must be at least 2 characters long"],
    },
    uniqueKey: {
      type: String,
      required: [true, "Unique key is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
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
    isUsedInTeam: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const UserRole: Model<IUserRole> =
  mongoose.models.UserRole ||
  mongoose.model<IUserRole>("UserRole", UserRoleSchema);

export default UserRole;
