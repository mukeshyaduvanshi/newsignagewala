import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import bcrypt from "bcryptjs";
import { sendManagerWelcomeEmail } from "@/lib/email/templates";
import { verifyAccessToken } from "@/lib/auth/jwt";

// GET - fetch all team members for the logged-in manager (uniqueKey is optional)
export async function GET(request: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(request);

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const uniqueKey = searchParams.get("uniqueKey"); // optional filter
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search") || "";

    if (page < 1 || limit < 1 || limit > 200) {
      return NextResponse.json(
        { success: false, error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Build query - scope by brand's userId, exclude the logged-in manager's own record
    const query: any = {
      parentId: managerAuth.parentId,
      // userId: { $ne: managerAuth.userId },
    };

    // Filter by uniqueKey only if provided
    if (uniqueKey) {
      query.uniqueKey = uniqueKey;
    }

    if (status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await TeamMember.countDocuments(query);

    const teamMembers = await TeamMember.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedMembers = teamMembers.map((member: any) => ({
      _id: member._id.toString(),
      parentId: member.parentId.toString(),
      uniqueKey: member.uniqueKey,
      userId: member.userId.toString(),
      name: member.name,
      email: member.email,
      phone: member.phone,
      managerType: member.managerType,
      canChangeType: member.canChangeType ?? true,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedMembers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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

// POST - add a new team member under the logged-in manager
export async function POST(request: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(request);

    await connectDB();

     const authHeader = request.headers.get("authorization");
        const accessToken = authHeader?.replace("Bearer ", "");
    
        if (!accessToken) {
          return NextResponse.json(
            { error: "Unauthorized - No token provided" },
            { status: 401 }
          );
        }
    
        // Verify token and get user ID
        const decoded = verifyAccessToken(accessToken);
        if (!decoded) {
          return NextResponse.json(
            { error: "Unauthorized - Invalid token" },
            { status: 401 }
          );
        }
    
        const managerId = decoded.userId;
    
        // Verify user is brand
        const manager = await User.findById(managerId);
    
    
        if (!manager || manager.userType !== "manager") {
          return NextResponse.json(
            { error: "Access denied - Manager only" },
            { status: 403 }
          );
        }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      managerType,
      uniqueKey,
      canChangeType = true,
      sendEmail = false,
    } = body;

    if (!name || !email || !phone || !managerType || !uniqueKey) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be a valid 10-digit number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    let userId;
    let isNewUser = false;

    if (existingUser) {
      // Check if already a team member under this brand
      const existingTeamMember = await TeamMember.findOne({
        parentId: managerAuth.parentId,
        userId: existingUser._id,
      });

      if (existingTeamMember) {
        return NextResponse.json(
          { success: false, error: "This user is already a team member" },
          { status: 409 }
        );
      }

      userId = existingUser._id;
    } else {
      const defaultPassword = "Welcome@123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        userType: "manager",
        parentId: managerAuth.parentId,
        isEmailVerified: true,
        isPhoneVerified: true,
        adminApproval: true,
      });

      userId = newUser._id;
      isNewUser = true;
    }

    const teamMember = await TeamMember.create({
      parentId: managerAuth.parentId,
      uniqueKey,
      userId,
      name,
      email: email.toLowerCase(),
      phone,
      managerType,
      canChangeType,
      createdBy: managerId, // Admin who assigned this manager
      status: "active",
    });

    const formattedMember = {
      _id: teamMember._id.toString(),
      parentId: teamMember.parentId.toString(),
      uniqueKey: teamMember.uniqueKey,
      userId: userId.toString(),
      name: teamMember.name,
      email: teamMember.email,
      phone: teamMember.phone,
      managerType: teamMember.managerType,
      canChangeType: teamMember.canChangeType,
      status: teamMember.status,
      createdBy: managerId,
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt,
    };

    if (sendEmail && isNewUser) {
      try {
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login`;
        await sendManagerWelcomeEmail({
          to: email.toLowerCase(),
          name,
          password: "Welcome@123",
          managerType,
          loginUrl,
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isNewUser
          ? "Team member added successfully"
          : "Existing user added as team member successfully",
        data: formattedMember,
        tempPassword: isNewUser ? "Welcome@123" : undefined,
        isExistingUser: !isNewUser,
      },
      { status: 201 }
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
