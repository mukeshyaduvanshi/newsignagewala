import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import { invalidateUserRolesCache } from "@/modules/admin/user-roles/user-roles.controller";

// Function to convert label name to camelCase
function generateUniqueKey(labelName: string): string {
  return labelName
    .trim()
    .split(/\s+/) // Split by one or more spaces
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get access token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const userId = decoded.userId;

    // Verify user is admin
    const user = await User.findById(userId);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 },
      );
    }

    const { labelName, description } = await req.json();

    // Validation
    if (!labelName || !description) {
      return NextResponse.json(
        { error: "Label name and description are required" },
        { status: 400 },
      );
    }

    if (labelName.length < 2) {
      return NextResponse.json(
        { error: "Label name must be at least 2 characters long" },
        { status: 400 },
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters long" },
        { status: 400 },
      );
    }

    // Generate uniqueKey from labelName
    const uniqueKey = generateUniqueKey(labelName);

    // Create user role with admin's userId
    const userRole = await UserRole.create({
      labelName,
      uniqueKey,
      description,
      createdId: userId, // Admin's ID
      parentId: userId, // Admin's ID
      isActive: true,
      isUsedInTeam: false,
    });

    await invalidateUserRolesCache(userId).catch(() => {});

    return NextResponse.json(
      {
        message: "User role created successfully",
        data: userRole,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create user role error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user role" },
      { status: 500 },
    );
  }
}
