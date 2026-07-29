import { NextResponse } from "next/server";
import { backfillDetails } from "@/lib/sync-news";
import { verifyCronSecret } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await backfillDetails();
    return NextResponse.json({
      success: true,
      backfilled: result.backfilled,
      remaining: result.remaining,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: "Backfill failed", details: String(error) },
      { status: 500 }
    );
  }
}