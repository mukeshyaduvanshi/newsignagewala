import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";

export async function GET(req: NextRequest) {
  try {
    // Get manager authentication from JWT token (just verify user is authenticated)
    const managerAuth = await requireManagerAuth(req);

    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: "Invalid pincode - must be 6 digits" },
        { status: 400 }
      );
    }

    // Using India Post Pincode API
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (!data || data.length === 0 || data[0].Status !== "Success") {
      return NextResponse.json(
        { success: false, error: "Pincode not found" },
        { status: 404 }
      );
    }

    const postOffice = data[0].PostOffice[0];

    return NextResponse.json({
      success: true,
      data: {
        country: postOffice.Country || "India",
        state: postOffice.State || "",
        city: postOffice.District || "",
      },
    });
  } catch (error: any) {
    console.error("Error looking up pincode:", error);
    return NextResponse.json(
      { success: false, error: "Failed to lookup pincode", details: error.message },
      { status: 500 }
    );
  }
}
