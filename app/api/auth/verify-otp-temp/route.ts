import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import OTP from "@/lib/models/OTP";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { identifier, otp, type } = await req.json();

    console.log("Verify OTP request:", { identifier, otp, type });

    if (!identifier || !otp || !type) {
      return NextResponse.json(
        { success: false, message: "Identifier, OTP, and type are required" },
        { status: 400 }
      );
    }

    // Find the OTP record - first check if any exists
    const allOtps = await OTP.find({ identifier, type }).sort({ createdAt: -1 });
    // console.log("All OTPs for identifier:", allOtps);

    // Find the specific OTP record
    const otpRecord = await OTP.findOne({
      identifier,
      otp,
      type,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    // console.log("Found OTP record:", otpRecord);

    if (!otpRecord) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid or expired OTP",
          debug: {
            identifier,
            otp,
            type,
            allOtpsCount: allOtps.length,
            currentTime: new Date()
          }
        },
        { status: 400 }
      );
    }

    // Check if already verified
    if (otpRecord.verified) {
      return NextResponse.json(
        { success: false, message: "OTP already verified" },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // console.log("OTP verified successfully:", otpRecord);

    return NextResponse.json(
      {
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Verify OTP Temp error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}