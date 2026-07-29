import { NextResponse } from "next/server";
import { syncAllSections } from "@/lib/sync-news";
import { verifyCronSecret } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllSections();
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      details: result.details,
      timestamp: new Date().toISOString(),
      note: "List sync only. Call /api/backfill-details with X-Cron-Secret header to fill images/content.",
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}