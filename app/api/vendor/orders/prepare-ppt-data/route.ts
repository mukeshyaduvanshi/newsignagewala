import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import Store from "@/lib/models/Store";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

// MongoDB client for temp collection
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoTempClient?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoTempClient) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoTempClient = client.connect();
  }
  clientPromise = globalWithMongo._mongoTempClient;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // Filter sites with status "vendorVerified"
    const vendorVerifiedSites = order.sites.filter(
      (site: any) => site.status === "vendorVerified"
    );

    if (vendorVerifiedSites.length === 0) {
      return NextResponse.json(
        { message: "No vendor verified sites found in this order" },
        { status: 400 }
      );
    }

    // Get unique storeIds
    const storeIds = [
      ...new Set(vendorVerifiedSites.map((site: any) => site.storeId.toString())),
    ];
    
    // Fetch all stores
    const stores = await Store.find({ _id: { $in: storeIds } });
    
    // Create store map for quick lookup
    const storeMap = new Map();
    stores.forEach((store) => {
      storeMap.set(store._id.toString(), store);
    });

    // Group sites by store
    const storeGroupedData: { [storeId: string]: any[] } = {};
    
    vendorVerifiedSites.forEach((site: any) => {
      const storeIdStr = site.storeId.toString();
      if (!storeGroupedData[storeIdStr]) {
        storeGroupedData[storeIdStr] = [];
      }
      storeGroupedData[storeIdStr].push(site);
    });

    // Format data similar to cjarekipptgen structure
    const formattedData = Object.keys(storeGroupedData).map((storeIdStr) => {
      const store = storeMap.get(storeIdStr);
      const sitesForStore = storeGroupedData[storeIdStr];
      
      return {
        storeName: store?.storeName || "N/A",
        storeAddress: store?.storeAddress || "N/A",
        storePhoto: store?.storeImage || null,
        storeGPSLocation: store?.storeLocation?.coordinates 
          ? {
              lng: store.storeLocation.coordinates[0],
              lat: store.storeLocation.coordinates[1]
            }
          : { lat: "", lng: "" },
        sites: sitesForStore.map((site: any, index: number) => ({
          beforeImage: site.photo || null,
          afterImage: site.capturedImages && site.capturedImages.length > 0 
            ? site.capturedImages[0] 
            : null,
          additionalAfterImages: site.capturedImages && site.capturedImages.length > 1
            ? site.capturedImages.slice(1)
            : [],
          siteDesc: site.siteDescription || site.elementName || null,
          siteElemName: site.elementName || null,
          siteHeight: site.height || null,
          siteNumber: index + 1,
          siteWidth: site.width || null,
          sitemUnit: site.measurementUnit || "inch",
        }))
      };
    });

    // Save to temporary collection
    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB_NAME);
    const tempCollection = db.collection(process.env.MONGODB_COLLECTION_NAME_SHARE_LINK || "temp_ppt_data");
    
    // Insert data into temp collection
    const insertResult = await tempCollection.insertOne({
      orderId: order._id,
      orderNumber: order.orderNumber,
      data: formattedData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
    });

    // Return the temp ID
    return NextResponse.json({
      success: true,
      tempId: insertResult.insertedId.toString(),
      message: "PPT data prepared successfully",
    });

  } catch (error: any) {
    console.error("Error preparing PPT data:", error);
    return NextResponse.json(
      { message: "Error preparing PPT data", error: error.message },
      { status: 500 }
    );
  }
}
