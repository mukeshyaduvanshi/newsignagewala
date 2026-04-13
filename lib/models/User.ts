import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: "brand" | "vendor" | "admin" | "manager";
  managerType?: string;
  uniqueKey?: string;
  parentId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBusinessInformation: boolean;
  isBusinessKyc: boolean;
  adminApproval: boolean;
  refreshTokens: string[]; // Array to store active refresh tokens
  resetPasswordOTP?: string;
  resetPasswordOTPExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    userType: {
      type: String,
      enum: ["brand", "vendor", "admin", "manager"],
      required: [true, "User type is required"],
    },
    // managerType: {
    //   type: String,
    //   required: function (this: IUser) {
    //     return this.userType === "manager";
    //   },
    // },
    // uniqueKey: {
    //   type: String,
    //   required: function (this: IUser) {
    //     return this.userType === "manager";
    //   },
    // },
    // parentId: {
    //   type: Schema.Types.ObjectId,
    //   required: function (this: IUser) {
    //     return this.userType === "manager";
    //   },
    // },
    isEmailVerified: {
      type: Boolean,
      default: function (this: IUser) {
        return this.userType === "manager" ? true : false;
      },
    },
    isPhoneVerified: {
      type: Boolean,
      default: function (this: IUser) {
        return this.userType === "manager" ? true : false;
      },
    },
    isBusinessInformation: {
      type: Boolean,
      default: function (this: IUser) {
        // Only set default false for brand/vendor, undefined for admin/manager
        return this.userType === "brand" || this.userType === "vendor"
          ? false
          : undefined;
      },
      required: function (this: IUser) {
        // Only required for brand/vendor users
        return this.userType === "brand" || this.userType === "vendor";
      },
    },
    isBusinessKyc: {
      type: Boolean,
      default: function (this: IUser) {
        return this.userType === "brand" || this.userType === "vendor"
          ? false
          : undefined;
      },
      required: function (this: IUser) {
        return this.userType === "brand" || this.userType === "vendor";
      },
    },
    adminApproval: {
      type: Boolean,
      default: function (this: IUser) {
        return this.userType === "brand" || this.userType === "vendor"
          ? false
          : true;
      },
      required: function (this: IUser) {
        return this.userType === "brand" || this.userType === "vendor";
      },
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false, // Don't include in queries by default for security
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpiry: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
