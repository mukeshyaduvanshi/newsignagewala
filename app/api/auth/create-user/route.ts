import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email/templates";
import { generateTokenPair } from "@/lib/auth/jwt";
import { serialize } from 'cookie';
import { createDefaultManagerRoles } from "@/lib/utils/create-default-roles";

export async function POST(req: NextRequest) {
  try {
    console.log("[CREATE_USER] ========== NEW USER CREATION REQUEST ==========");
    await connectDB();
    console.log("[CREATE_USER] ✅ Database connected");

    const { name, email, phone, password, confirmPassword, userType, isEmailVerified, isPhoneVerified } = await req.json();

    console.log(`[CREATE_USER] Request data: { name: "${name}", email: "${email}", phone: "${phone}", userType: "${userType}", isEmailVerified: ${isEmailVerified}, isPhoneVerified: ${isPhoneVerified} }`);

    // Validate required fields
    if (!name || !email || !phone || !password || !confirmPassword || !userType) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: "Phone number must be 10 digits" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 409 }
        );
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { success: false, message: "Phone number already registered" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    console.log("[CREATE_USER] Creating user in database...");
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      userType,
      isEmailVerified: isEmailVerified || false,
      isPhoneVerified: isPhoneVerified || false,
    });

    console.log(`[CREATE_USER] ✅ User created successfully with ID: ${user._id}, Type: ${user.userType}`);

    // Create default manager roles for brand users
    console.log(`[CREATE_USER] Checking if need to create default roles... User type: ${userType}`);
    if (userType === 'brand') {
      // console.log(`[CREATE_USER] 🎯 User is a BRAND! Creating default manager roles...`);
      try {
        await createDefaultManagerRoles(user._id);
        console.log(`[CREATE_USER] ✅ Default manager roles created successfully for brand ${user._id}!`);
      } catch (error) {
        console.error("[CREATE_USER] ❌ Failed to create default manager roles:", error);
        console.error("[CREATE_USER] Error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          brandUserId: user._id
        });
        // Don't fail the user creation, just log the error
        // The brand can manually create roles later
      }
    } else {
      console.log(`[CREATE_USER] Skipping role creation - user type is "${userType}", not "brand"`);
    }

    // console.log("User created:", user);

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id.toString(),
      user.email,
      user.userType
    );

    // Store refresh token in user document
    user.refreshTokens = [refreshToken];
    await user.save();

    // Set refresh token as HTTP-only cookie
    const refreshTokenCookie = serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Send welcome email if both email and phone are verified
    if (isEmailVerified && isPhoneVerified) {
      try {
        await sendWelcomeEmail({
          to: email,
          name,
        });
        // console.log("Welcome email sent");
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the registration if email sending fails
      }
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
      isBusinessInformation: user.isBusinessInformation,
      isBusinessKyc: user.isBusinessKyc,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully!",
        accessToken,
        user: userResponse,
      },
      { status: 201 }
    );

    // Set the refresh token cookie
    response.headers.set('Set-Cookie', refreshTokenCookie);

    console.log(`[CREATE_USER] ========== USER CREATION COMPLETED SUCCESSFULLY ==========`);
    console.log(`[CREATE_USER] User ID: ${user._id}, Type: ${user.userType}`);

    return response;
  } catch (error: any) {
    console.error("[CREATE_USER] ========== ERROR OCCURRED ==========");
    console.error("[CREATE_USER] ❌ Create user error:", error);
    console.error("[CREATE_USER] Error name:", error?.name);
    console.error("[CREATE_USER] Error message:", error?.message);
    console.error("[CREATE_USER] Error stack:", error?.stack);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}