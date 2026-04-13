import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { sendPasswordResetOTP } from "@/lib/email/templates";
import { sendSMSOTP } from "@/lib/sms/fast2sms";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { emailOrPhone } = await req.json();

    if (!emailOrPhone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if it's email or phone
    const isEmail = emailOrPhone.includes("@");
    const isPhone = /^[0-9]{10}$/.test(emailOrPhone);

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: "Invalid email or phone number format" },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }
    ).select("+resetPasswordOTP +resetPasswordOTPExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email or phone number" },
        { status: 404 }
      );
    }

    // Check if user is verified (either email or phone should be verified)
    if (!user.isEmailVerified && !user.isPhoneVerified) {
      return NextResponse.json(
        { error: "Please verify your account first" },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP based on type
    if (isEmail) {
      const emailResult = await sendPasswordResetOTP({
        to: user.email,
        name: user.name,
        otp,
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { error: "Failed to send OTP email" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "OTP sent to your email",
        type: "email",
        identifier: user.email,
      });
    } else {
      const smsResult = await sendSMSOTP(user.phone, otp);

      if (!smsResult.success) {
        return NextResponse.json(
          { error: "Failed to send OTP SMS" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "OTP sent to your phone",
        type: "phone",
        identifier: user.phone,
      });
    }
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
