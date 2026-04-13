import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: "Please provide a valid 6-digit pincode" },
        { status: 400 }
      );
    }

    // Using India Post Pincode API
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (!data || data.length === 0 || data[0].Status !== "Success") {
      return NextResponse.json(
        { error: "Invalid pincode or data not found" },
        { status: 404 }
      );
    }

    const postOffice = data[0].PostOffice[0];
    
    return NextResponse.json({
      country: postOffice.Country || "India",
      state: postOffice.State || "",
      city: postOffice.District || "",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching pincode data:", error);
    return NextResponse.json(
      { error: "Failed to fetch pincode data", details: error.message },
      { status: 500 }
    );
  }
}
