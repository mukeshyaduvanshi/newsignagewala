import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";

const ME_TTL = 300; // 5 min

function meCacheKey(userId: string) {
  return `auth:v1:me:${userId}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Access token required" },
        { status: 401 },
      );
    }

    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired access token" },
        { status: 401 },
      );
    }

    const result = await getOrSetCache(
      meCacheKey(tokenPayload.userId),
      async () => {
        const user = await User.findById(tokenPayload.userId);
        if (!user) return null;
        return {
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
      },
      ME_TTL,
      `Me[${tokenPayload.userId}]`,
    );

    const userResponse = (result as any).data ?? result;

    if (!userResponse) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, user: userResponse },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
