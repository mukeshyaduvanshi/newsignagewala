import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import UserRole from "@/lib/models/UserRole"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { extractBearerToken } from "@/lib/auth/jwt"
import { invalidateUserRolesCache } from "@/lib/utils/sidebar-cache"

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
    .join('');
}

export async function PUT(req: NextRequest) {
  try {
    // Extract and verify token
    const token = extractBearerToken(req.headers.get("authorization"))

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const decoded = verifyAccessToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await req.json()
    const { id, labelName, description } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "User role ID is required" },
        { status: 400 }
      )
    }

    if (!labelName || labelName.length < 2) {
      return NextResponse.json(
        { error: "Label name must be at least 2 characters" },
        { status: 400 }
      )
    }

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 }
      )
    }

    // Find the user role and verify ownership
    const existingAuthority = await UserRole.findById(id)

    if (!existingAuthority) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 404 }
      )
    }

    // Check if the user is the creator or parent
    if (
      existingAuthority.createdId.toString() !== decoded.userId &&
      existingAuthority.parentId.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update this authority" },
        { status: 403 }
      )
    }

    // Generate uniqueKey from labelName
    const uniqueKey = generateUniqueKey(labelName);

    // Update the user role
    const updatedAuthority = await UserRole.findByIdAndUpdate(
      id,
      {
        labelName,
        uniqueKey,
        description,
      },
      { new: true }
    )

    // 🔥 INVALIDATE CACHE - Force refetch on next request
    await invalidateUserRolesCache(decoded.userId, 'vendor');

    return NextResponse.json(
      {
        message: "User role updated successfully",
        authority: updatedAuthority,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user role" },
      { status: 500 }
    )
  }
}
