import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import bcrypt from "bcryptjs";
import { generateOTP } from "@/lib/utils/otp";
import { sendOTPEmail } from "@/lib/email/templates";
import { sendSMSOTP } from "@/lib/sms/fast2sms";
import { generateTokenPair } from "@/lib/auth/jwt";
import { serialize } from 'cookie';
import BusinessDetails from "@/lib/models/BusinessDetails";
import TeamMember from "@/lib/models/TeamMember";

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { emailOrPhone, password } = body;

    // console.log("Login request:", { emailOrPhone, hasPassword: !!password });

    // Validate required fields
    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { success: false, message: "Email/Phone and password are required" },
        { status: 400 }
      );
    }

    // Check if emailOrPhone is an email or phone number
    const isEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
      emailOrPhone
    );
    const isPhone = /^[0-9]{10}$/.test(emailOrPhone);

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email or phone number",
        },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }
    ).select('+refreshTokens'); // Include refreshTokens field

    // const businessDetails = await BusinessDetails.findOne({ userId: user?._id });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      // Generate new OTPs
      const emailOTP = generateOTP();
      const phoneOTP = generateOTP();

      // Delete old OTPs
      await OTP.deleteMany({ 
        identifier: { $in: [user.email, user.phone] } 
      });

      // Save new OTPs
      if (!user.isEmailVerified) {
        await OTP.create({
          identifier: user.email,
          otp: emailOTP,
          type: "email",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await sendOTPEmail({
          to: user.email,
          name: user.name,
          otp: emailOTP,
        });
      }

      if (!user.isPhoneVerified) {
        await OTP.create({
          identifier: user.phone,
          otp: phoneOTP,
          type: "phone",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await sendSMSOTP(user.phone, phoneOTP);
      }

      return NextResponse.json(
        {
          success: false,
          requiresVerification: true,
          message: `Please verify your ${!user.isEmailVerified ? 'email' : ''} ${!user.isEmailVerified && !user.isPhoneVerified ? 'and' : ''} ${!user.isPhoneVerified ? 'phone' : ''}. OTP sent.`,
          user: {
            email: user.email,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
          },
        },
        { status: 403 }
      );
    }

    // Fetch company logo from BusinessDetails
    const businessDetails = await BusinessDetails.findOne({ parentId: user._id });

    // Check if user is a manager with brand associations
    const managerAssociations = await TeamMember.find({
      userId: user._id,
      status: "active"
    }).populate('parentId', 'name email').lean();

    let brandsList = null;
    let singleBrandData = null;
    
    if (managerAssociations && managerAssociations.length > 0) {
      if (managerAssociations.length === 1) {
        // Single brand - automatically set up manager data
        const tm: any = managerAssociations[0];
        const brandDetails = await BusinessDetails.findOne({ 
          parentId: tm.parentId._id 
        }).lean();
        
        singleBrandData = {
          brandId: tm.parentId._id,
          brandName: brandDetails?.companyName || tm.parentId.name,
          brandEmail: tm.parentId.email,
          companyLogo: brandDetails?.companyLogo || null,
          managerType: tm.managerType,
          teamMemberId: tm._id,
          teamMemberName: tm.name,
          teamMemberEmail: tm.email,
          teamMemberPhone: tm.phone,
          uniqueKey: tm.uniqueKey,
          parentId: tm.parentId._id
        };
      } else {
        // Multiple brands - show selection modal
        brandsList = await Promise.all(
          managerAssociations.map(async (tm: any) => {
            const brandDetails = await BusinessDetails.findOne({ 
              parentId: tm.parentId._id 
            }).lean();
            return {
              brandId: tm.parentId._id,
              brandName: brandDetails?.companyName || tm.parentId.name,
              brandEmail: tm.parentId.email,
              companyLogo: brandDetails?.companyLogo || null,
              managerType: tm.managerType,
              teamMemberId: tm._id,
              teamMemberName: tm.name,
              teamMemberEmail: tm.email,
              teamMemberPhone: tm.phone,
              uniqueKey: tm.uniqueKey
            };
          })
        );
      }
    }

    // Generate JWT tokens (with manager data if single brand)
    let accessToken, refreshToken;
    
    if (singleBrandData) {
      // Generate token with parentId and uniqueKey for single brand manager
      const accessTokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType,
        parentId: singleBrandData.brandId.toString(),
        uniqueKey: singleBrandData.uniqueKey,
      };
      
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
      const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
      const jwt = require('jsonwebtoken');
      
      accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
        expiresIn: '1d',
        issuer: 'signagewala-app',
        audience: 'signagewala-users',
      });
      
      const refreshTokenPayload = {
        userId: user._id.toString(),
        tokenId: Date.now().toString(),
        userType: user.userType,
      };
      
      refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
        expiresIn: '7d',
        issuer: 'signagewala-app',
        audience: 'signagewala-users',
      });
    } else {
      const tokens = generateTokenPair(
        user._id.toString(),
        user.email,
        user.userType
      );
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    }

    // Store refresh token in user document (for token rotation/revocation)
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    
    // Keep only last 5 refresh tokens (cleanup old ones)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();

    // Set refresh token as HTTP-only cookie
    const refreshTokenCookie = serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

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
      companyLogo: singleBrandData ? singleBrandData.companyLogo : businessDetails?.companyLogo || null,
      companyName: singleBrandData ? singleBrandData.brandName : businessDetails?.companyName || null,
      isBusinessKyc: user.isBusinessKyc,
      adminApproval: singleBrandData ? true : user.adminApproval,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Manager-specific fields for single brand
      ...(singleBrandData && {
        selectedBrandId: singleBrandData.brandId,
        parentId: singleBrandData.parentId,
        managerType: singleBrandData.managerType,
        uniqueKey: singleBrandData.uniqueKey,
        teamMemberId: singleBrandData.teamMemberId,
        teamMemberName: singleBrandData.teamMemberName,
        teamMemberEmail: singleBrandData.teamMemberEmail,
        teamMemberPhone: singleBrandData.teamMemberPhone,
      }),
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        accessToken,
        user: userResponse,
        requiresBrandSelection: brandsList !== null,
        brands: brandsList
      },
      { status: 200 }
    );

    // Set the refresh token cookie
    response.headers.set('Set-Cookie', refreshTokenCookie);

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
