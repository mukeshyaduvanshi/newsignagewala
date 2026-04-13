import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function PUT(req: NextRequest) {
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
    const { name } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
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

    // Name can be changed anytime - no restrictions

    // Update name
    user.name = name.trim();
    await user.save();

    return NextResponse.json(
      {
        message: "Name updated successfully",
        data: { name: user.name },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating name:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
