import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { resetToken, password } = await req.json();

    if (!resetToken || !password) {
      return NextResponse.json(
        { error: "Reset token and password are required" },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one special character" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiry: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordTokenExpiry +resetPasswordOTP +resetPasswordOTPExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset tokens
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;

    await user.save();

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
