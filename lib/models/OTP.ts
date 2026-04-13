import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOTP extends Document {
  identifier: string; // email or phone
  otp: string;
  type: "email" | "phone";
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OTPSchema: Schema<IOTP> = new Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["email", "phone"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete expired OTPs after expiresAt time
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP: Model<IOTP> =
  mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema);

export default OTP;
