import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import OpenJobCards from "@/lib/models/OpenJobCards";

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    // Get token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized. Only vendors can update job card status." },
        { status: 403 }
      );
    }

    // Get jobCardId and new status from request body
    const { jobCardId, status } = await request.json();

    if (!jobCardId || !status) {
      return NextResponse.json(
        { error: "jobCardId and status are required" },
        { status: 400 }
      );
    }

    // Update job card's orderStatus
    const updatedJobCard = await OpenJobCards.findByIdAndUpdate(
      jobCardId,
      {
        orderStatus: status,
      },
      {
        new: true,
      }
    );

    if (!updatedJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Job card status updated successfully",
        jobCard: updatedJobCard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating job card status:", error);
    return NextResponse.json(
      { error: "Failed to update job card status" },
      { status: 500 }
    );
  }
}
