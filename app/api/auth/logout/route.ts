import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get refresh token from cookie
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Verify and remove refresh token from user's document
      const tokenPayload = verifyRefreshToken(refreshToken);
      
      if (tokenPayload) {
        const user = await User.findById(tokenPayload.userId).select('+refreshTokens');
        if (user) {
          // Remove the refresh token from user's tokens array
          user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
          await user.save();
        }
      }
    }

    // Clear refresh token cookie
    const clearCookie = serialize('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expire
      path: '/',
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );

    // Clear the refresh token cookie
    response.headers.set('Set-Cookie', clearCookie);

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    
    // Even if there's an error, clear the cookie
    const clearCookie = serialize('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    const response = NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );

    response.headers.set('Set-Cookie', clearCookie);
    return response;
  }
}