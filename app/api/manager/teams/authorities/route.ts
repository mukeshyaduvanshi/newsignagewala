import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import { requireManagerAuth } from "@/lib/auth/manager-auth";

// GET - fetch team authorities/roles from the manager's parent brand
export async function GET(request: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(request);

    await connectDB();

    // Roles are created by the brand (manager's parentId), not by the manager itself
    const authorities = await UserRole.find({
      parentId: managerAuth.parentId,
      isActive: true,
    })
      .select("labelName uniqueKey description createdAt")
      .sort({ labelName: 1 })
      .lean();

    const formattedAuthorities = authorities.map((auth: any) => ({
      _id: auth._id.toString(),
      labelName: auth.labelName,
      uniqueKey: auth.uniqueKey,
      description: auth.description,
      createdAt: auth.createdAt,
    }));

    return NextResponse.json(
      { success: true, data: formattedAuthorities },
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
