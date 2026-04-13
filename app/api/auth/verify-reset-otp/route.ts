import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { emailOrPhone, otp } = await req.json();

    if (!emailOrPhone || !otp) {
      return NextResponse.json(
        { error: "Email/phone and OTP are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if it's email or phone
    const isEmail = emailOrPhone.includes("@");

    // Find user by email or phone
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }
    ).select("+resetPasswordOTP +resetPasswordOTPExpiry +resetPasswordToken +resetPasswordTokenExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if OTP exists
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > user.resetPasswordOTPExpiry) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.resetPasswordOTP !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Generate reset token (valid for 15 minutes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = resetTokenExpiry;
    
    // Clear OTP after verification
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    
    await user.save();

    return NextResponse.json({
      message: "OTP verified successfully",
      resetToken,
      userId: user._id,
    });
  } catch (error: any) {
    console.error("Verify reset OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
