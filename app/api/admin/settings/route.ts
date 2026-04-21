import { readSettings } from "@/lib/admin/settings-store";
import { NextResponse } from "next/server";

export async function GET() {
  const settings = await readSettings();

  return NextResponse.json({
    ...settings,
    // Surface key presence (boolean only — never expose value)
    hasAnthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
    hasGoogle: Boolean(process.env.GOOGLE_API_KEY),
  });
}
