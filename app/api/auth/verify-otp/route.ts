import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { isValidOTP } from "@/lib/utils/otp";
import { sendWelcomeEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { identifier, otp, type } = body; // identifier can be email or phone

    // Validate required fields
    if (!identifier || !otp || !type) {
      return NextResponse.json(
        { success: false, message: "Identifier, OTP, and type are required" },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!isValidOTP(otp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format" },
        { status: 400 }
      );
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      identifier: type === "email" ? identifier.toLowerCase() : identifier,
      otp,
      type,
      verified: false,
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user and verify
    const user = await User.findOne(
      type === "email" 
        ? { email: identifier.toLowerCase() } 
        : { phone: identifier }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update user verification status
    if (type === "email") {
      user.isEmailVerified = true;
    } else {
      user.isPhoneVerified = true;
    }
    await user.save();

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Send welcome email only when both are verified
    if (user.isEmailVerified && user.isPhoneVerified) {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
      });
    }

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    };

    const message = user.isEmailVerified && user.isPhoneVerified
      ? "All verifications complete! Welcome email sent."
      : `${type === "email" ? "Email" : "Phone"} verified successfully! ${user.isEmailVerified && !user.isPhoneVerified ? "Please verify your phone." : !user.isEmailVerified && user.isPhoneVerified ? "Please verify your email." : ""}`;

    return NextResponse.json(
      {
        success: true,
        message,
        user: userResponse,
        allVerified: user.isEmailVerified && user.isPhoneVerified,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("OTP verification error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
