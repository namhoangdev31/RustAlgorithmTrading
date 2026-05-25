import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("Missing NEXT_PUBLIC_RECAPTCHA_SECRET_KEY in environment");
      return NextResponse.json(
        { success: false, error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    // ReCaptcha V3 returns a score between 0.0 and 1.0 (higher is better / human)
    // and checks if the actions match
    if (data.success && data.score >= 0.5) {
      return NextResponse.json({ success: true, score: data.score });
    } else {
      console.warn("ReCaptcha validation failed:", data);
      return NextResponse.json(
        {
          success: false,
          error: "Recaptcha verification failed. Please try again.",
          score: data.score,
          "error-codes": data["error-codes"],
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Recaptcha verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
