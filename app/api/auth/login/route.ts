import connectDB from "@/lib/db/mongodb";
import { loginController } from "@/modules/auth/auth.controller";
import { Ruthie } from "next/font/google";
import { NextRequest, NextResponse } from "next/server";
import { success } from "zod";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const result = await loginController(body);

    const response = NextResponse.json(result.body, {
      status: result.status,
    });

    if (result.cookie) {
      response.headers.set("Set-Cookie", result.cookie);
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 },
    );
  }
}
