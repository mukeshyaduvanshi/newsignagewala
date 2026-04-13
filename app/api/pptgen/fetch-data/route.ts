import clientPromise from "@/lib/db/mongodb-client";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing ID parameter" }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const tempCollection = db.collection(process.env.MONGODB_COLLECTION_NAME_SHARE_LINK || "temp_ppt_data");
    
    const data = await tempCollection.findOne({ _id: new ObjectId(id) });
    
    if (!data) {
      console.log("No data found for ID:", id);
      return NextResponse.json(
        { error: "Data not found for the provided ID", found: false }, 
        { status: 404 }
      );
    }
    
    // Check if data has expired
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      // Delete expired data
      await tempCollection.deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json(
        { error: "Data has expired", found: false }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data fetched successfully",
      data: data.data,
      orderNumber: data.orderNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching PPT data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
