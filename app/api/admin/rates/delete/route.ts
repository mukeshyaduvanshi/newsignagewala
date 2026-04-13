import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MasterRate from "@/lib/models/MasterRate"
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt"
import User from "@/lib/models/User"

export async function DELETE(req: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = req.headers.get("authorization")
    const token = extractBearerToken(authHeader)

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
    const { id } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Master rate ID is required" },
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

    // Admin can only delete their own master rates
    if (existingRate.createdId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own master rates" },
        { status: 403 }
      )
    }

    // Check if the rate is being used
    if (existingRate.isUsedInRates) {
      return NextResponse.json(
        { 
          error: "Cannot delete this rate as it is currently in use",
          isUsedInRates: true 
        },
        { status: 400 }
      )
    }

    // Soft delete (set isActive to false)
    const updatedRate = await MasterRate.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )

    return NextResponse.json(
      {
        message: "Master rate deleted successfully",
        data: updatedRate,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting master rate:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete master rate" },
      { status: 500 }
    )
  }
}
