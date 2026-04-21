import { describe, expect, it } from "vitest";
import cases from "./prompts.json";
import { loadActivePrompt } from "@/lib/brand-voice";
import { buildUserContent } from "@/lib/ai/user-content";
import { generateDraft, parseDraft } from "@/lib/ai/client";
import { runQCChecks } from "@/lib/ai/qc";
import { generateRequestSchema, type QCReport } from "@/lib/schemas";

/**
 * Golden tests hit the real Anthropic API and cost a few baht per run.
 * Opt-in with `RUN_GOLDEN=1 npm run test:golden`.
 * The suite skips by default so `npm test` in CI stays free and fast.
 */
const shouldRun = process.env.RUN_GOLDEN === "1";
const describeMaybe = shouldRun ? describe : describe.skip;

describeMaybe("brand voice golden set", () => {
  for (const c of cases.cases) {
    it(c.id, async () => {
      const req = generateRequestSchema.parse({ input: c.input });
      const { text } = await loadActivePrompt();
      const result = await generateDraft({
        systemPrompt: text,
        userContent: buildUserContent(req),
      });
      const parsed = parseDraft(result.text);

      if ("clarify" in parsed) {
        expect(c.expect_clarify, `${c.id}: unexpected CLARIFY response`).toBe(true);
        return;
      }

      const qc: QCReport = runQCChecks({
        body: parsed.body,
        recipientContext: req.input.recipient_context ?? "",
      });

      for (const field of c.expect_qc ?? []) {
        expect(qc[field as keyof QCReport], `${c.id} → ${field}`).toBe(true);
      }
    }, 45_000);
  }
});
