import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { identifier, type } = await req.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { success: false, message: "Identifier and type are required" },
        { status: 400 }
      );
    }

    // console.log(`Checking if ${type} exists:`, identifier);

    // Check if user exists based on type
    let existingUser;
    
    if (type === "email") {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: "Invalid email format" },
          { status: 400 }
        );
      }
      
      existingUser = await User.findOne({ 
        email: identifier,
        $or: [
          { isEmailVerified: true },
          { isPhoneVerified: true }
        ]
      });
    } else if (type === "phone") {
      // Validate phone format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: "Phone number must be 10 digits" },
          { status: 400 }
        );
      }
      
      existingUser = await User.findOne({ 
        phone: identifier,
        $or: [
          { isEmailVerified: true },
          { isPhoneVerified: true }
        ]
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Type must be either 'email' or 'phone'" },
        { status: 400 }
      );
    }

    const exists = !!existingUser;
    
    // console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} ${identifier} exists:`, exists);
    
    // if (existingUser) {
    //   console.log("Existing user details:", {
    //     id: existingUser._id,
    //     email: existingUser.email,
    //     phone: existingUser.phone,
    //     isEmailVerified: existingUser.isEmailVerified,
    //     isPhoneVerified: existingUser.isPhoneVerified
    //   });
    // }

    return NextResponse.json(
      {
        success: true,
        exists,
        message: exists 
          ? `${type.charAt(0).toUpperCase() + type.slice(1)} is already registered`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} is available`
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Check existing error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}