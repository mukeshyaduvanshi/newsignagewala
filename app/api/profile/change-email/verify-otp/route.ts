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
    const { newEmail, otp } = body;

    // Validation
    if (!newEmail || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
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
      identifier: newEmail,
      otp: otp,
      type: "email",
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

    // Update email
    user.email = newEmail;
    user.isEmailVerified = true;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      {
        message: "Email updated successfully",
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying OTP for email change:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
