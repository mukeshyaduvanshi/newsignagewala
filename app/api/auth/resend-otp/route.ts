import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { generateOTP } from "@/lib/utils/otp";
import { sendOTPEmail } from "@/lib/email/templates";
import { sendSMSOTP } from "@/lib/sms/fast2sms";

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { identifier, type } = body; // identifier: email or phone, type: "email" or "phone"

    // Validate required fields
    if (!identifier || !type) {
      return NextResponse.json(
        { success: false, message: "Identifier and type are required" },
        { status: 400 }
      );
    }

    // Find user
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

    // Check if already verified
    if ((type === "email" && user.isEmailVerified) || (type === "phone" && user.isPhoneVerified)) {
      return NextResponse.json(
        { success: false, message: `${type === "email" ? "Email" : "Phone"} is already verified` },
        { status: 400 }
      );
    }

    // Delete any existing OTPs for this identifier
    await OTP.deleteMany({ identifier: type === "email" ? identifier.toLowerCase() : identifier, type });

    // Generate new OTP
    const otpCode = generateOTP();

    // Save OTP to database
    await OTP.create({
      identifier: type === "email" ? identifier.toLowerCase() : identifier,
      otp: otpCode,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP
    let result;
    if (type === "email") {
      result = await sendOTPEmail({
        to: identifier,
        name: user.name,
        otp: otpCode,
      });
    } else {
      result = await sendSMSOTP(identifier, otpCode);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: `Failed to send OTP via ${type}. Please try again.` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `New OTP sent to your ${type}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend OTP error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
