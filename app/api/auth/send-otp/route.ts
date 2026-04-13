import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import OTP from "@/lib/models/OTP";
import { generateOTP } from "@/lib/utils/otp";
import { sendOTPEmail } from "@/lib/email/templates";
import { sendSMSOTP } from "@/lib/sms/fast2sms";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { identifier, type } = await req.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { success: false, message: "Identifier and type are required" },
        { status: 400 }
      );
    }

    // Validate identifier based on type
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: "Invalid email format" },
          { status: 400 }
        );
      }
    } else if (type === "phone") {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: "Invalid phone format" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid type. Must be 'email' or 'phone'" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // console.log("Sending OTP:", { identifier, otp, type });

    // Delete any existing OTP for this identifier
    await OTP.deleteMany({ identifier });

    // Save new OTP
    const otpRecord = await OTP.create({
      identifier,
      otp,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verified: false,
    });

    // console.log("OTP saved to database:", otpRecord);

    // Send OTP
    try {
      if (type === "email") {
        await sendOTPEmail({
          to: identifier,
          name: "User",
          otp,
        });
      } else if (type === "phone") {
        await sendSMSOTP(identifier, otp);
      }

      return NextResponse.json(
        {
          success: true,
          message: `OTP sent to your ${type}`,
        },
        { status: 200 }
      );
    } catch (sendError) {
      console.error("Error sending OTP:", sendError);
      
      // Delete the OTP if sending failed
      await OTP.deleteOne({ identifier, otp });
      
      return NextResponse.json(
        {
          success: false,
          message: `Failed to send OTP to your ${type}. Please try again.`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}