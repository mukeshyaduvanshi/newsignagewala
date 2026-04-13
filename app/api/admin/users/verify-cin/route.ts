import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import DocumentModel from "@/lib/models/Document";

export async function POST(req: NextRequest) {
  try {
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

    const { reg, userId } = await req.json();

    if (!reg) {
      return NextResponse.json(
        { error: "CIN number is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // First check if document already exists in Documents collection
    const existingDoc = await DocumentModel.findOne({
      documentType: 'cin',
      documentNumber: reg.toUpperCase(),
    });

    if (existingDoc && existingDoc.verified && existingDoc.verificationData) {
      // Return cached data from database
      return NextResponse.json({
        success: true,
        verified: true,
        data: existingDoc.verificationData,
        cached: true,
      });
    }

    // AttestR credentials - TEMPORARY HARDCODED FOR TESTING
    const ATTESTR_AUTH_TOKEN = process.env.ATTESTR_AUTH_TOKEN!;

    // Create Basic Auth token

    const payload = {
      reg: reg,
      charges: true,
      efilings: true,
      live: false,
    };

    const response = await fetch(
      `https://api.attestr.com/api/v2/public/corpx/business/master`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ATTESTR_AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `HTTP ${response.status}: ${responseText}`
      );
    }

    const verifiedData = data.data || data;

    // Save verified data to Documents collection
    await DocumentModel.findOneAndUpdate(
      {
        documentType: 'cin',
        documentNumber: reg.toUpperCase(),
      },
      {
        documentType: 'cin',
        documentNumber: reg.toUpperCase(),
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: decoded.userId,
        verificationData: verifiedData,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      verified: true,
      data: verifiedData,
    });
  } catch (error: any) {
    console.error(`❌ CIN Verification Error:`, error.message);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: error.message || "CIN verification failed",
      },
      { status: 500 }
    );
  }
}
