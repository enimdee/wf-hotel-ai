import { type NextRequest, NextResponse } from "next/server";
import { getRecentDrafts } from "@/lib/admin/drafts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const drafts = await getRecentDrafts(30);
  return NextResponse.json(drafts);
}
