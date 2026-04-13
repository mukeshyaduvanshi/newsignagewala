import connectDB from "@/lib/db/mongodb";
import { signupController } from "@/modules/auth/auth.controller";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const result = await signupController(body);

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
