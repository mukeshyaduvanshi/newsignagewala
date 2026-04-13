import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import OpenJobCards from "@/lib/models/OpenJobCards";

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    // Get token
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return NextResponse.json(
    //     { error: "No token provided" },
    //     { status: 401 }
    //   );
    // }

    // const token = authHeader.substring(7);
    // const decoded = verifyAccessToken(token);

    // if (!decoded) {
    //   return NextResponse.json(
    //     { error: "Invalid or expired token" },
    //     { status: 401 }
    //   );
    // }

    // if (decoded.userType !== "vendor") {
    //   return NextResponse.json(
    //     { error: "Unauthorized. Only vendors can update site status." },
    //     { status: 403 }
    //   );
    // }

    // Get jobCardId and siteId from request body
    const { jobCardId, siteId, status } = await request.json();

    if (!jobCardId || !siteId) {
      return NextResponse.json(
        { error: "jobCardId and siteId are required" },
        { status: 400 }
      );
    }

    // Update the specific site's status in the job card
    const updatedJobCard = await OpenJobCards.findOneAndUpdate(
      {
        _id: jobCardId,
        "sites.siteId": siteId,
      },
      {
        $set: {
          "sites.$.status": status || "printed",
        },
      },
      {
        new: true,
      }
    );

    if (!updatedJobCard) {
      return NextResponse.json(
        { error: "Job card or site not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Site status updated successfully",
        jobCard: updatedJobCard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating site status:", error);
    return NextResponse.json(
      { error: "Failed to update site status" },
      { status: 500 }
    );
  }
}
