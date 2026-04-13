import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User, { IUser } from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import bcrypt from "bcryptjs";
import { generateOTP } from "@/lib/utils/otp";
import { sendOTPEmail } from "@/lib/email/templates";
import { sendSMSOTP } from "@/lib/sms/fast2sms";
import { Document } from "mongoose";
import { createDefaultManagerRoles } from "@/lib/utils/create-default-roles";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    console.log('[SIGNUP] ========== NEW SIGNUP REQUEST ==========');
    
    // Connect to database
    await connectDB();
    console.log('[SIGNUP] ✅ Database connected');

    // Parse request body
    const body = await req.json();
    const { name, email, phone, password, userType } = body;
    
    console.log(`[SIGNUP] Request data: { name: "${name}", email: "${email}", phone: "${phone}", userType: "${userType}" }`);

    // Validate required fields
    if (!name || !email || !phone || !password || !userType) {
      console.log('[SIGNUP] ❌ Validation failed - missing required fields');
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if this is an admin signup
    const isAdminSignup = userType === "admin";
    
    // For admin signup, verify credentials match environment variables
    if (isAdminSignup) {
      const adminEmail = process.env.ADMIN_EMAIL || "mukeshyaduvanshi1508@gmail.com";
      const adminPhone = process.env.ADMIN_PHONE || "7827095778";
      const adminPassword = process.env.ADMIN_PASSWORD || "Mukesh@150802";
      const adminName = process.env.ADMIN_NAME || "Mukesh Yaduvanshi";
      
      if (
        email.toLowerCase() !== adminEmail.toLowerCase() ||
        phone !== adminPhone ||
        password !== adminPassword ||
        name.toLowerCase() !== adminName.toLowerCase()
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid admin credentials" },
          { status: 403 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { success: false, message: "Phone number already registered" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object based on userType
    const userData: any = {
      name,
      email,
      phone,
      password: hashedPassword,
      userType,
      isEmailVerified: false,
      isPhoneVerified: false,
    };

    // Only add business fields for brand/vendor users, NOT for admin or manager
    if (userType === 'brand' || userType === 'vendor') {
      userData.isBusinessInformation = false;
      userData.isBusinessKyc = false;
      userData.adminApproval = false;
    }
    // Admin and Manager users don't need business fields at all

    // Create new user - User.create can return array or single doc, we need single
    console.log('[SIGNUP] Creating user in database...');
    const createdUsers = await User.create([userData]);
    const user = createdUsers[0];
    console.log(`[SIGNUP] ✅ User created successfully with ID: ${user._id}, Type: ${user.userType}`);

    // Generate OTPs for both email and phone
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();
    console.log(`[SIGNUP] Generated OTPs for email and phone`);

    // Save OTPs to database
    await OTP.create({
      identifier: email,
      otp: emailOTP,
      type: "email",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await OTP.create({
      identifier: phone,
      otp: phoneOTP,
      type: "phone",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    console.log('[SIGNUP] ✅ OTPs saved to database');

    // Send OTP email
    console.log(`[SIGNUP] Sending OTP email to ${email}...`);
    const emailResult = await sendOTPEmail({
      to: email,
      name,
      otp: emailOTP,
    });
    // console.log(`[SIGNUP] Email send result: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`);

    // Send OTP SMS
    console.log(`[SIGNUP] Sending OTP SMS to ${phone}...`);
    const smsResult = await sendSMSOTP(phone, phoneOTP);
    // console.log(`[SIGNUP] SMS send result: ${smsResult.success ? 'SUCCESS' : 'FAILED'}`);

    if (!emailResult.success || !smsResult.success) {
      // If either fails, delete the user and OTPs
      await User.findByIdAndDelete(user._id);
      await OTP.deleteMany({ identifier: { $in: [email, phone] } });
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to send OTP. Email: ${emailResult.success ? 'OK' : 'Failed'}, SMS: ${smsResult.success ? 'OK' : 'Failed'}` 
        },
        { status: 500 }
      );
    }

    // Create default manager roles for brand users
    // console.log(`[SIGNUP] User type: ${userType}, User ID: ${user._id}`);
    
    if (userType === 'brand') {
      // console.log(`[SIGNUP] Creating default manager roles for brand user ${user._id}...`);
      try {
        await createDefaultManagerRoles(user._id as mongoose.Types.ObjectId);
        // console.log(`[SIGNUP] ✅ Default manager roles created successfully!`);
      } catch (error) {
        console.error("[SIGNUP] ❌ Failed to create default manager roles:", error);
        // Don't fail the signup, just log the error
        // The brand can manually create roles later
      }
    } else {
      // console.log(`[SIGNUP] Skipping role creation - user type is ${userType}, not brand`);
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
    };

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! OTP sent to your email and phone.",
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[SIGNUP] ========== ERROR OCCURRED ==========");
    console.error("[SIGNUP] ❌ Signup error:", error);
    console.error("[SIGNUP] Error name:", error?.name);
    console.error("[SIGNUP] Error message:", error?.message);
    console.error("[SIGNUP] Error stack:", error?.stack);
    
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { success: false, message: messages.join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
