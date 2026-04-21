import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";
import { sendManagerWelcomeEmail } from "@/lib/email/templates";
import BusinessDetails from "@/lib/models/BusinessDetails";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/utils/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const rl = await checkRateLimit(request, {
      namespace: "teams:members:get",
      key: decoded.userId,
      maxRequests: 120,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const uniqueKey = searchParams.get("uniqueKey");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search") || "";

    console.log(
      "GET Request - uniqueKey:",
      uniqueKey,
      "parentId:",
      decoded.userId,
      "status:",
      status,
      "search:",
      search,
    );

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 200) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 200",
        },
        { status: 400 },
      );
    }

    if (!uniqueKey) {
      return NextResponse.json(
        { success: false, error: "uniqueKey is required" },
        { status: 400 },
      );
    }

    // Build query
    const query: any = {
      parentId: decoded.userId,
      uniqueKey: uniqueKey,
    };

    // Filter by status if not 'all'
    if (status !== "all") {
      query.status = status;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await TeamMember.countDocuments(query);

    console.log("Query:", JSON.stringify(query), "Total found:", total);

    // Get team members - no need to populate, data is in TeamMember collection
    const teamMembers = await TeamMember.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Team members fetched:", teamMembers.length);

    // Transform data
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
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const rl = await checkRateLimit(request, {
      namespace: "teams:members:post",
      key: decoded.userId,
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    await connectDB();

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

    // Validation
    if (!name || !email || !phone || !managerType || !uniqueKey) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be a valid 10-digit number" },
        { status: 400 },
      );
    }

    // Check if user already exists in users collection
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    let userId;
    let isNewUser = false;

    if (existingUser) {
      // User already exists, check if already a team member under this parent
      const existingTeamMember = await TeamMember.findOne({
        parentId: decoded.userId,
        userId: existingUser._id,
      });

      if (existingTeamMember) {
        return NextResponse.json(
          {
            success: false,
            error: "This user is already a team member",
          },
          { status: 409 },
        );
      }

      // Use existing user's ID
      userId = existingUser._id;
      console.log("Using existing user:", existingUser._id);
    } else {
      // Create new user in User collection
      const defaultPassword = "Welcome@123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        userType: "manager",
        parentId: decoded.userId,
        isEmailVerified: true,
        isPhoneVerified: true,
        adminApproval: true,
      });

      userId = newUser._id;
      isNewUser = true;
      console.log("Created new user:", newUser._id);
    }

    // Create team member entry
    const teamMember = await TeamMember.create({
      parentId: decoded.userId,
      uniqueKey,
      userId: userId,
      name,
      email: email.toLowerCase(),
      phone,
      managerType,
      canChangeType,
      status: "active",
    });

    // Format response
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
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt,
    };

    // Send welcome email only if it's a new user and email is requested
    if (sendEmail && isNewUser) {
      try {
        const defaultPassword = "Welcome@123";
        const loginUrl = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/auth/login`;
        await sendManagerWelcomeEmail({
          to: email.toLowerCase(),
          name,
          password: defaultPassword,
          managerType,
          loginUrl,
        });
        console.log("Welcome email sent successfully to:", email);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the request if email fails
      }
    }

    const responseMessage = isNewUser
      ? "Team member added successfully"
      : "Existing user added as team member successfully";

    return NextResponse.json(
      {
        success: true,
        message: responseMessage,
        data: formattedMember,
        tempPassword: isNewUser ? "Welcome@123" : undefined,
        isExistingUser: !isNewUser,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
