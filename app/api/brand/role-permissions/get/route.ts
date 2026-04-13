import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import { verifyAccessToken } from "@/lib/auth/jwt";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
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

    // Fetch work authorities created by this user or where user is parent
    const userId = new mongoose.Types.ObjectId(decoded.userId);
    const workAuthorities = await RolePermission.find({
      $or: [{ createdId: userId }, { parentId: userId }],
      isActive: true,
    }).sort({ createdAt: 1 }); // Ascending order (oldest first)

    return NextResponse.json(
      {
        message: "Role permissions fetched successfully",
        data: workAuthorities,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
