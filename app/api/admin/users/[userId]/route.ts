import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import BusinessDetails from "@/lib/models/BusinessDetails";

// GET - Fetch user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { userId } = await params;

    // Find user and exclude password
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch business details if user is brand or vendor
    let businessDetails = null;
    if (user.userType === "brand" || user.userType === "vendor") {
      businessDetails = await BusinessDetails.findOne({ userId: user._id })
        .select("-__v")
        .lean();
    }

    // Prepare response
    const userData = {
      ...user,
      _id: user._id.toString(),
      businessDetails: businessDetails ? {
        ...businessDetails,
        _id: businessDetails._id.toString(),
      } : null,
    };

    return NextResponse.json(
      {
        message: "User fetched successfully",
        user: userData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH - Update user approval status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { userId } = await params;
    const { adminApproval } = await req.json();

    if (typeof adminApproval !== "boolean") {
      return NextResponse.json(
        { error: "adminApproval must be a boolean" },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only update brand and vendor users
    if (user.userType !== "brand" && user.userType !== "vendor") {
      return NextResponse.json(
        { error: "Can only update brand or vendor users" },
        { status: 400 }
      );
    }

    user.adminApproval = adminApproval;
    await user.save();

    // TODO: Send SSE notification to connected clients
    // This would require a global SSE manager/broadcaster

    return NextResponse.json(
      {
        message: `User ${
          adminApproval ? "approved" : "rejected"
        } successfully`,
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          adminApproval: user.adminApproval,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user approval:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user approval" },
      { status: 500 }
    );
  }
}

// PUT - Update user details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { userId } = await params;
    const updateData = await req.json();

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only update brand and vendor users
    if (user.userType !== "brand" && user.userType !== "vendor") {
      return NextResponse.json(
        { error: "Can only update brand or vendor users" },
        { status: 400 }
      );
    }

    // Update allowed fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.phone) user.phone = updateData.phone;
    if (typeof updateData.adminApproval === "boolean") {
      user.adminApproval = updateData.adminApproval;
    }

    await user.save();

    // TODO: Send SSE notification to connected clients

    return NextResponse.json(
      {
        message: "User updated successfully",
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          adminApproval: user.adminApproval,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
