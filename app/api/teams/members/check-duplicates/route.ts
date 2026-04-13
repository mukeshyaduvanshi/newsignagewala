import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import connectDB from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { managers } = body;

    if (!managers || !Array.isArray(managers)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Check database for existing users with these emails or phones
    const emails = managers.map((m) => m.email.toLowerCase()).filter(Boolean);
    const phones = managers.map((m) => m.phone).filter(Boolean);

    const existingUsers = await User.find({
      $or: [
        { email: { $in: emails } },
        { phone: { $in: phones } },
      ],
    }).select("email phone");

    // Create a set of existing email-phone combinations
    const existingKeys = new Set<string>();
    existingUsers.forEach((user) => {
      if (user.email) existingKeys.add(`email:${user.email.toLowerCase()}`);
      if (user.phone) existingKeys.add(`phone:${user.phone}`);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          existingKeys: Array.from(existingKeys),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
