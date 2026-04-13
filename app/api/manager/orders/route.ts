import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import TeamMember from "@/lib/models/TeamMember";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get manager auth data from JWT token
    const managerAuth = await requireManagerAuth(req);
    
    // console.log("Manager Auth Data:", {
    //   userId: managerAuth.userId,
    //   userType: managerAuth.userType,
    //   parentId: managerAuth.parentId,
    //   teamMemberId: managerAuth.teamMemberId
    // });

    let teamMemberId: mongoose.Types.ObjectId;

    // If teamMemberId is in JWT token (new flow), use it directly
    if (managerAuth.teamMemberId) {
      teamMemberId = new mongoose.Types.ObjectId(managerAuth.teamMemberId);
    //   console.log("Using teamMemberId from JWT token:", teamMemberId);
    } else {
      // Fallback: Find the TeamMember entry for this manager (old flow)
      const managerUserObjectId = new mongoose.Types.ObjectId(managerAuth.userId);
      const teamMember = await TeamMember.findOne({
        userId: managerUserObjectId,
        status: "active"
      });

      if (!teamMember) {
        // console.log("No TeamMember found for userId:", managerAuth.userId);
        return NextResponse.json(
          {
            message: "No team member profile found",
            orders: [],
          },
          { status: 200 }
        );
      }

      teamMemberId = teamMember._id;
    //   console.log("Using teamMemberId from database query:", teamMemberId);
    }

    // Fetch orders where creativeManagerId matches the TeamMember._id
    const orders = await Order.find({
      creativeManagerId: teamMemberId,
    })
      .populate("vendorId", "companyName email phone")
      .populate("brandId", "companyName email phone")
      .sort({ createdAt: -1 })
      .lean();

    // console.log(`Found ${orders.length} orders for creative manager`);

    return NextResponse.json(
      {
        message: "Orders fetched successfully",
        orders,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching manager orders:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
