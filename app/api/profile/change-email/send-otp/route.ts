import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { generateOTP } from "@/lib/utils/otp";
import { sendOTPEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Extract and verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { newEmail } = body;

    // Validation
    if (!newEmail) {
      return NextResponse.json(
        { error: "New email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete old OTPs for this email
    await OTP.deleteMany({ identifier: newEmail });

    // Save new OTP
    await OTP.create({
      identifier: newEmail,
      otp: otp,
      type: "email",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail({
      to: newEmail,
      name: user.name,
      otp: otp,
    });

    return NextResponse.json(
      {
        message: "OTP sent to new email successfully",
        email: newEmail,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending OTP for email change:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
