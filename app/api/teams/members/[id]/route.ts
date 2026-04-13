import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, uniqueKey, managerType } = body;

    // Find team member and verify ownership
    const teamMember = await TeamMember.findOne({
      _id: id,
      parentId: decoded.userId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    // Check if trying to change manager type/uniqueKey when not allowed
    if ((uniqueKey || managerType) && !teamMember.canChangeType) {
      return NextResponse.json(
        { success: false, error: "Cannot change manager type for this member" },
        { status: 403 }
      );
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email is already used by another user
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: teamMember.userId },
      });

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { success: false, error: "Phone must be a valid 10-digit number" },
          { status: 400 }
        );
      }

      // Check if phone is already used by another user
      const existingPhone = await User.findOne({
        phone,
        _id: { $ne: teamMember.userId },
      });

      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "Phone already in use" },
          { status: 409 }
        );
      }
    }

    // Update user data in User collection
    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (email) userUpdateData.email = email.toLowerCase();
    if (phone) userUpdateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      teamMember.userId,
      userUpdateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Update TeamMember collection with same data
    const teamMemberUpdateData: any = {};
    if (name) teamMemberUpdateData.name = name;
    if (email) teamMemberUpdateData.email = email.toLowerCase();
    if (phone) teamMemberUpdateData.phone = phone;
    if (uniqueKey && teamMember.canChangeType) teamMemberUpdateData.uniqueKey = uniqueKey;
    if (managerType && teamMember.canChangeType) teamMemberUpdateData.managerType = managerType;

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      id,
      teamMemberUpdateData,
      { new: true }
    );

    const formattedMember = {
      _id: updatedTeamMember!._id.toString(),
      parentId: updatedTeamMember!.parentId.toString(),
      uniqueKey: updatedTeamMember!.uniqueKey,
      userId: updatedUser._id.toString(),
      managerType: updatedTeamMember!.managerType,
      canChangeType: updatedTeamMember!.canChangeType,
      status: updatedTeamMember!.status,
      createdAt: updatedTeamMember!.createdAt,
      updatedAt: updatedTeamMember!.updatedAt,
      name: updatedTeamMember!.name,
      email: updatedTeamMember!.email,
      phone: updatedTeamMember!.phone,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Team member updated successfully",
        data: formattedMember,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !["active", "inactive", "deleted"].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Status must be one of: active, inactive, deleted" 
        },
        { status: 400 }
      );
    }

    // Find team member and verify ownership
    const teamMember = await TeamMember.findOne({
      _id: id,
      parentId: decoded.userId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    // Update status in TeamMember collection
    teamMember.status = status;
    await teamMember.save();

    const formattedMember = {
      _id: teamMember._id.toString(),
      parentId: teamMember.parentId.toString(),
      uniqueKey: teamMember.uniqueKey,
      userId: teamMember.userId.toString(),
      managerType: teamMember.managerType,
      status: teamMember.status,
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt,
      name: teamMember.name,
      email: teamMember.email,
      phone: teamMember.phone,
    };

    return NextResponse.json(
      {
        success: true,
        message: `Team member status updated to ${status}`,
        data: formattedMember,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating team member status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
