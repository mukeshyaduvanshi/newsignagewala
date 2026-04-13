import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import mongoose from "mongoose";

// InstallationCertificates model
const siteSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId },
  elementName: { type: String },
  siteDescription: { type: String },
  storeName: { type: String },
  storeId: { type: mongoose.Schema.Types.ObjectId },
  photo: { type: String },
  width: { type: Number },
  height: { type: Number },
  measurementUnit: { type: String },
  rate: { type: Number },
  calculateUnit: { type: String },
  quantity: { type: Number },
  creativeLink: { type: String },
  instructions: { type: String },
  storeLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
}, { _id: false });

const installationCertificateSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  orderDate: { type: Date, required: true },
  deadlineDate: { type: Date, required: true },
  orderStatus: { type: String, required: true },
  sites: [siteSchema],
  createdAt: { type: Date, default: Date.now },
});

const InstallationCertificate =
  mongoose.models.InstallationCertificate ||
  mongoose.model("InstallationCertificate", installationCertificateSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }

    const certificate = await InstallationCertificate.findById(id);

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Installation certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: certificate },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get Installation Certificate - Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch installation certificate",
      },
      { status: 500 }
    );
  }
}
