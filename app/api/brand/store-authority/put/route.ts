import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import StoreAuthority from "@/lib/models/StoreAuthority";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { invalidateStoreAuthorityCache } from "@/modules/brands/store-authority/store-authority.controller";

// Function to convert option to camelCase uniqueKey
function generateUniqueKey(option: string): string {
  return option
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

export async function PUT(req: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = req.headers.get("authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await req.json();
    const { id, selectedOptions } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Store authority ID is required" },
        { status: 400 },
      );
    }

    if (
      !selectedOptions ||
      !Array.isArray(selectedOptions) ||
      selectedOptions.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one option must be selected" },
        { status: 400 },
      );
    }

    // Find the store authority and verify ownership
    const existingAuthority = await StoreAuthority.findById(id);

    if (!existingAuthority) {
      return NextResponse.json(
        { error: "Store authority not found" },
        { status: 404 },
      );
    }

    // Check if the user is the creator or parent
    if (
      existingAuthority.createdId.toString() !== decoded.userId &&
      existingAuthority.parentId.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update this authority" },
        { status: 403 },
      );
    }

    // Generate uniqueKeys from selectedOptions
    const uniqueKeys = selectedOptions.map((option) =>
      generateUniqueKey(option),
    );

    // Update the store authority
    const updatedAuthority = await StoreAuthority.findByIdAndUpdate(
      id,
      { selectedOptions, uniqueKeys },
      { new: true },
    );

    // 🔥 INVALIDATE CACHE - Force refetch on next request
    await invalidateStoreAuthorityCache(decoded.userId);

    return NextResponse.json(
      {
        message: "Store authority updated successfully",
        authority: updatedAuthority,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating store authority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update store authority" },
      { status: 500 },
    );
  }
}
