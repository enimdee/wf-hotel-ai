import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb, getPool } from "@/lib/db/client";
import { brandVoicePrompts, users } from "@/lib/db/schema";
import { getSeedPrompt, SEED_PROMPT_VERSION } from "@/lib/brand-voice";

const PILOT_USERS = [
  { email: "sakchai.nim@chatrium.com", name: "Sakchai Nimdee", role: "it_admin", property: "rawai" },
  { email: "richard.meh@chatrium.com", name: "Richard Adrian Mehr", role: "general_manager", property: "rawai" },
  { email: "anuwat.wat@chatrium.com", name: "Anuwat Wat", role: "it_admin", property: "rawai" },
] as const;

async function main() {
  const db = getDb();

  console.log(`Seeding brand_voice_prompts version ${SEED_PROMPT_VERSION}…`);
  const existing = await db.select().from(brandVoicePrompts).where(eq(brandVoicePrompts.version, SEED_PROMPT_VERSION));
  if (existing.length === 0) {
    await db.insert(brandVoicePrompts).values({
      version: SEED_PROMPT_VERSION,
      promptText: getSeedPrompt(),
      isActive: 1,
      createdBy: "sakchai.nim@chatrium.com",
      notes: "Seeded from lib/brand-voice/prompt.md",
    });
    console.log("  inserted.");
  } else {
    console.log("  already present, skipping.");
  }

  console.log("Seeding pilot users…");
  for (const u of PILOT_USERS) {
    const found = await db.select().from(users).where(eq(users.email, u.email));
    if (found.length === 0) {
      await db.insert(users).values(u);
      console.log(`  inserted ${u.email}`);
    } else {
      console.log(`  already present: ${u.email}`);
    }
  }

  await getPool().end();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
