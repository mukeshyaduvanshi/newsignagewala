import clientPromise from "@/lib/db/mongodb-client";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log("Deleting temp PPT data for ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing ID parameter" }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const tempCollection = db.collection(process.env.MONGODB_COLLECTION_NAME_SHARE_LINK || "temp_ppt_data");
    
    const deleteResult = await tempCollection.deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "Document not found or already deleted" }, 
        { status: 404 }
      );
    }

    console.log("Successfully deleted temp PPT data for ID:", id);

    return NextResponse.json({
      success: true,
      message: "Temp data deleted successfully",
      id: id,
      deletedCount: deleteResult.deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error deleting temp PPT data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
