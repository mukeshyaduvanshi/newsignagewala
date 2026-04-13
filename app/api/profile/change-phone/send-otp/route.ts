import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { generateOTP } from "@/lib/utils/otp";
import { sendSMSOTP } from "@/lib/sms/fast2sms";

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
    const { newPhone } = body;

    // Validation
    if (!newPhone) {
      return NextResponse.json(
        { error: "New phone number is required" },
        { status: 400 }
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(newPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
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

    // Check if phone already exists
    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser) {
      return NextResponse.json(
        { error: "Phone number already in use" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete old OTPs for this phone
    await OTP.deleteMany({ identifier: newPhone });

    // Save new OTP
    await OTP.create({
      identifier: newPhone,
      otp: otp,
      type: "phone",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP via SMS
    await sendSMSOTP(newPhone, otp);

    return NextResponse.json(
      {
        message: "OTP sent to new phone number successfully",
        phone: newPhone,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending OTP for phone change:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
