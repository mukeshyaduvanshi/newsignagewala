import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import TeamMember from "@/lib/models/TeamMember";
import connectDB from "@/lib/db/mongodb";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
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

    const userId = decoded.userId;

    // Verify user is brand
    const manager = await User.findById(userId);


    if (!manager || manager.userType !== "manager") {
      return NextResponse.json(
        { error: "Access denied - Manager only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { members, parentId } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: "No members data provided" },
        { status: 400 }
      );
    }

    if (members.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 members allowed per upload" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each member
    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      try {
        // Validate required fields
        if (!member.name || !member.email || !member.phone) {
          results.failed++;
          results.errors.push({
            index: i + 1,
            email: member.email,
            error: "Missing required fields (name, email, phone)",
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email: member.email.toLowerCase() }, { phone: member.phone }],
        });

        if (existingUser) {
          results.failed++;
          results.errors.push({
            index: i + 1,
            email: member.email,
            error: "User already exists with this email or phone",
          });
          continue;
        }

        // Hash password (using Welcome@123 as default password)
        const hashedPassword = await bcrypt.hash("Welcome@123", 10);

        // Create new user in users collection
        const newUser = await User.create({
          name: member.name,
          email: member.email.toLowerCase(),
          phone: member.phone,
          password: hashedPassword,
          userType: "manager",
          managerType: member.managerType,
          uniqueKey: member.uniqueKey,
          // parentId: userId,
          isEmailVerified: true,
          isPhoneVerified: true,
          adminApproval: true,
          refreshTokens: [],
        });

        // Create team member entry
        await TeamMember.create({
          parentId: parentId,
          uniqueKey: member.uniqueKey,
          userId: newUser._id,
          name: member.name,
          email: member.email.toLowerCase(),
          phone: member.phone,
          managerType: member.managerType,
          canChangeType: true,
          status: "active",
        });

        results.created++;

        // TODO: Send email notification if member.sendEmail is true
        // if (member.sendEmail) {
        //   await sendWelcomeEmail(member.email, member.name, member.phone);
        // }
      } catch (error: any) {
        console.error(`Error creating member ${i + 1}:`, error);
        results.failed++;
        results.errors.push({
          index: i + 1,
          email: member.email,
          error: error.message || "Failed to create user",
        });
      }
    }

    return NextResponse.json(
      {
        message: `Bulk upload completed. Created: ${results.created}, Failed: ${results.failed}`,
        data: {
          created: results.created,
          failed: results.failed,
          errors: results.errors,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in bulk member upload:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
