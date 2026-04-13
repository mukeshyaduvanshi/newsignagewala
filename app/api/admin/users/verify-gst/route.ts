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

    const { gstin, userId } = await req.json();

    if (!gstin) {
      return NextResponse.json({ error: "GSTIN is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // First check if document already exists in Documents collection
    const existingDoc = await DocumentModel.findOne({
      documentType: 'gst',
      documentNumber: gstin.toUpperCase(),
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

    // Calculate last financial year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // If current month is April (4) or later, FY is current year
    // Otherwise, FY is previous year
    const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const lastFY = `${fyStartYear - 1}-${String(fyStartYear).slice(-2)}`;

    const payload = {
      gstin: gstin,
      fetchFilings: true,
      fy: lastFY,
    };

    // Try 1: Capital case headers
    const response = await fetch(
      `https://api.attestr.com/api/v2/public/corpx/gstin`,
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
        documentType: 'gst',
        documentNumber: gstin.toUpperCase(),
      },
      {
        documentType: 'gst',
        documentNumber: gstin.toUpperCase(),
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
    console.error(`❌ GST Verification Error:`, error.message);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: error.message || "GST verification failed",
      },
      { status: 500 }
    );
  }
}
