import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import Cart from "@/lib/models/cart.model";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  getTendersController,
  createTenderController,
} from "@/modules/brands/tenders/tenders.controller";

// POST: Create a new tender
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandId = decoded.userId;
    const body = await req.json();

    const tender = await createTenderController(brandId, body);

    return NextResponse.json(
      { message: "Tender created successfully", tender },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating tender:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tender" },
      { status: 500 },
    );
  }
}

// GET: Fetch all tenders for the brand
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandId = decoded.userId;

    const { data: tenders, source } = await getTendersController(brandId);
    return NextResponse.json({ tenders, source }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching tenders:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tenders" },
      { status: 500 },
    );
  }
}
