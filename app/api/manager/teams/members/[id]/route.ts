import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { requireManagerAuth } from "@/lib/auth/manager-auth";

// PUT - update team member details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const managerAuth = await requireManagerAuth(request);

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, uniqueKey, managerType } = body;

    // Find team member scoped to this brand
    const teamMember = await TeamMember.findOne({
      _id: id,
      parentId: managerAuth.parentId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    if ((uniqueKey || managerType) && !teamMember.canChangeType) {
      return NextResponse.json(
        { success: false, error: "Cannot change role for this member" },
        { status: 403 }
      );
    }

    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }

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

    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { success: false, error: "Phone must be a valid 10-digit number" },
          { status: 400 }
        );
      }

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

    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (email) userUpdateData.email = email.toLowerCase();
    if (phone) userUpdateData.phone = phone;

    await User.findByIdAndUpdate(teamMember.userId, userUpdateData, {
      new: true,
      runValidators: true,
    });

    const teamMemberUpdateData: any = {};
    if (name) teamMemberUpdateData.name = name;
    if (email) teamMemberUpdateData.email = email.toLowerCase();
    if (phone) teamMemberUpdateData.phone = phone;
    if (uniqueKey && teamMember.canChangeType) teamMemberUpdateData.uniqueKey = uniqueKey;
    if (managerType && teamMember.canChangeType) teamMemberUpdateData.managerType = managerType;

    const updated = await TeamMember.findByIdAndUpdate(id, teamMemberUpdateData, {
      new: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Team member updated successfully",
        data: {
          _id: updated!._id.toString(),
          name: updated!.name,
          email: updated!.email,
          phone: updated!.phone,
          uniqueKey: updated!.uniqueKey,
          managerType: updated!.managerType,
          canChangeType: updated!.canChangeType,
          status: updated!.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - toggle active/inactive status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const managerAuth = await requireManagerAuth(request);

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "inactive", "deleted"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be one of: active, inactive, deleted" },
        { status: 400 }
      );
    }

    const teamMember = await TeamMember.findOne({
      _id: id,
      parentId: managerAuth.parentId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    teamMember.status = status;
    await teamMember.save();

    return NextResponse.json(
      {
        success: true,
        message: `Team member ${status === "active" ? "activated" : "deactivated"} successfully`,
        data: {
          _id: teamMember._id.toString(),
          status: teamMember.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const managerAuth = await requireManagerAuth(request);

    await connectDB();

    const { id } = await params;

    const teamMember = await TeamMember.findOneAndDelete({
      _id: id,
      parentId: managerAuth.parentId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Team member removed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
