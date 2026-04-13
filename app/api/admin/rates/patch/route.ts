import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MasterRate from "@/lib/models/MasterRate"
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt"
import User from "@/lib/models/User"

export async function PATCH(req: NextRequest) {
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

    // Verify user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json()
    const { id, isActive } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Master rate ID is required" },
        { status: 400 }
      )
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "isActive must be a boolean value" },
        { status: 400 }
      )
    }

    // Find the master rate
    const existingRate = await MasterRate.findById(id)

    if (!existingRate) {
      return NextResponse.json(
        { error: "Master rate not found" },
        { status: 404 }
      )
    }

    // Admin can only update their own master rates
    if (existingRate.createdId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only update your own master rates" },
        { status: 403 }
      )
    }

    // Update the isActive status
    const updatedRate = await MasterRate.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    )

    return NextResponse.json(
      {
        message: `Master rate ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedRate,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating master rate status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update master rate status" },
      { status: 500 }
    )
  }
}
