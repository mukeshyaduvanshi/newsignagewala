import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import TeamMember from "@/lib/models/TeamMember";
import { verifyRefreshToken, generateTokenPair, verifyAccessToken } from "@/lib/auth/jwt";
import { serialize } from "cookie";
import BusinessDetails from "@/lib/models/BusinessDetails";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get refresh token from cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      console.error('[REFRESH] No refresh token found in cookie');
      return NextResponse.json(
        { success: false, message: "No refresh token found" },
        { status: 401 }
      );
    }

    console.log('[REFRESH] Refresh token found in cookie');

    // Verify refresh token
    const tokenPayload = verifyRefreshToken(refreshToken);
    if (!tokenPayload) {
      console.error('[REFRESH] Refresh token verification failed');
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 }
      );
    }

    console.log('[REFRESH] Refresh token verified, userId:', tokenPayload.userId);

    // Find user and check if refresh token is still valid
    const user = await User.findById(tokenPayload.userId).select(
      "+refreshTokens"
    );
    if (!user) {
      console.error('[REFRESH] User not found:', tokenPayload.userId);
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 }
      );
    }
    
    if (!user.refreshTokens.includes(refreshToken)) {
      console.error('[REFRESH] Refresh token not in user array');
      console.error('[REFRESH] User has tokens:', user.refreshTokens.length);
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 }
      );
    }
    
    console.log('[REFRESH] User found and token validated');

    const businessDetails = await BusinessDetails.findOne({
      parentId: user._id,
    });

    // Check if user is a manager and get manager context
    let managerContext: any = null;
    if (user.userType === 'manager') {
      console.log('[REFRESH] Manager detected, userId:', user._id.toString());
      
      // First, try to get manager context from old access token (if available)
      const authHeader = req.headers.get('authorization');
      console.log('[REFRESH] Authorization header present:', !!authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const oldAccessToken = authHeader.substring(7);
        const oldDecoded = verifyAccessToken(oldAccessToken);
        console.log('[REFRESH] Old token decoded:', !!oldDecoded);
        console.log('[REFRESH] Has manager context in token:', !!(oldDecoded && oldDecoded.parentId));
        
        // If old token had manager context, preserve it
        if (oldDecoded && oldDecoded.parentId && oldDecoded.uniqueKey) {
          managerContext = {
            parentId: oldDecoded.parentId,
            uniqueKey: oldDecoded.uniqueKey
          };
          
          // Fetch TeamMember data for response
          const teamMember = await TeamMember.findOne({
            userId: user._id,
            parentId: oldDecoded.parentId,
            uniqueKey: oldDecoded.uniqueKey,
            status: 'active'
          }).lean();
          
          if (teamMember) {
            const brandDetails = await BusinessDetails.findOne({
              parentId: oldDecoded.parentId
            }).lean();
            
            managerContext.teamMemberName = teamMember.name;
            managerContext.teamMemberEmail = teamMember.email;
            managerContext.teamMemberPhone = teamMember.phone;
            managerContext.managerType = teamMember.managerType;
            managerContext.companyLogo = brandDetails?.companyLogo || null;
            managerContext.companyName = brandDetails?.companyName || null;
          }
        }
      }
      
      // If no manager context from token, check TeamMember collection
      // (for single brand managers or after page refresh)
      if (!managerContext) {
        console.log('[REFRESH] No context from token, checking TeamMember collection...');
        
        const managerAssociations = await TeamMember.find({
          userId: user._id,
          status: 'active'
        }).lean();
        
        console.log('[REFRESH] Manager associations found:', managerAssociations?.length || 0);
        
        // If only one brand association, automatically set it up
        if (managerAssociations && managerAssociations.length === 1) {
          console.log('[REFRESH] Single brand manager - auto-restoring context');
          const tm: any = managerAssociations[0];
          const brandDetails = await BusinessDetails.findOne({
            parentId: tm.parentId
          }).lean();
          
          managerContext = {
            parentId: tm.parentId.toString(),
            uniqueKey: tm.uniqueKey,
            teamMemberName: tm.name,
            teamMemberEmail: tm.email,
            teamMemberPhone: tm.phone,
            managerType: tm.managerType,
            companyLogo: brandDetails?.companyLogo || null,
            companyName: brandDetails?.companyName || null,
          };
        } 
        // For multiple brands, try to restore from query parameter
        else if (managerAssociations && managerAssociations.length > 1) {
          console.log('[REFRESH] Multiple brand manager detected');
          const { searchParams } = new URL(req.url);
          const selectedBrandId = searchParams.get('selectedBrandId');
          console.log('[REFRESH] selectedBrandId from query:', selectedBrandId);
          
          if (selectedBrandId) {
            // Find the TeamMember entry for this brand
            const tm = managerAssociations.find(
              (tm: any) => tm.parentId.toString() === selectedBrandId
            );
            
            console.log('[REFRESH] TeamMember found for selectedBrandId:', !!tm);
            
            if (tm) {
              const brandDetails = await BusinessDetails.findOne({
                parentId: selectedBrandId
              }).lean();
              
              managerContext = {
                parentId: selectedBrandId,
                uniqueKey: (tm as any).uniqueKey,
                teamMemberName: (tm as any).name,
                teamMemberEmail: (tm as any).email,
                teamMemberPhone: (tm as any).phone,
                managerType: (tm as any).managerType,
                companyLogo: brandDetails?.companyLogo || null,
                companyName: brandDetails?.companyName || null,
              };
            }
          }
        }
        // For multiple brands without selected brand, cannot restore session
        // User will need to re-select brand (handled by frontend)
      }
      
      console.log('[REFRESH] Final manager context:', managerContext ? 'SET' : 'NOT SET');
      if (managerContext) {
        console.log('[REFRESH] Context parentId:', managerContext.parentId);
        console.log('[REFRESH] Context uniqueKey:', managerContext.uniqueKey);
      }
    }

    // Generate new token pair (with manager context if available)
    let accessToken, newRefreshToken;
    
    if (managerContext && managerContext.parentId && managerContext.uniqueKey) {
      // Generate token with manager context
      const accessTokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType,
        parentId: managerContext.parentId,
        uniqueKey: managerContext.uniqueKey,
      };
      
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
      
      newRefreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
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
      newRefreshToken = tokens.refreshToken;
    }

    // Remove old refresh token and add new one (token rotation)
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken
    );
    user.refreshTokens.push(newRefreshToken);

    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    // Set new refresh token as HTTP-only cookie
    const refreshTokenCookie = serialize("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Prepare user response
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
      adminApproval: managerContext ? true : user.adminApproval,
      companyLogo: managerContext?.companyLogo || businessDetails?.companyLogo || null,
      companyName: managerContext?.companyName || businessDetails?.companyName || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Manager-specific fields
      ...(managerContext && {
        selectedBrandId: managerContext.parentId,
        parentId: managerContext.parentId,
        uniqueKey: managerContext.uniqueKey,
        managerType: managerContext.managerType,
        teamMemberName: managerContext.teamMemberName,
        teamMemberEmail: managerContext.teamMemberEmail,
        teamMemberPhone: managerContext.teamMemberPhone,
      }),
    };

    const response = NextResponse.json(
      {
        success: true,
        accessToken,
        user: userResponse,
      },
      { status: 200 }
    );

    // Set the new refresh token cookie
    response.headers.set("Set-Cookie", refreshTokenCookie);

    return response;
  } catch (error: any) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
