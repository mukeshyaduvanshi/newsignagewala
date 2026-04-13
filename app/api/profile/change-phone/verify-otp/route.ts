import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { verifyAccessToken } from "@/lib/auth/jwt";

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
    const { newPhone, otp } = body;

    // Validation
    if (!newPhone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
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

    // Verify OTP
    const otpRecord = await OTP.findOne({
      identifier: newPhone,
      otp: otp,
      type: "phone",
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    // Update phone
    user.phone = newPhone;
    user.isPhoneVerified = true;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      {
        message: "Phone number updated successfully",
        phone: user.phone,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying OTP for phone change:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
