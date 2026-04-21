import { describe, expect, it } from "vitest";
import { anyCriticalQCFailed, runQCChecks } from "@/lib/ai/qc";

const CLEAN_DRAFT = `Dear Ms. Chen,

Thank you for choosing Chatrium Rawai Phuket for this meaningful stay. As a valued Diamond member, your reservation for five nights, 24 to 28 April, is confirmed.

To complement the occasion, we are pleased to extend a complimentary 60-minute couples spa experience and a private welcome amenity on arrival. We have also reserved a late check-out until 2:00 PM on the day of departure.

We would be delighted to reserve a table for you at Etcha, our signature dining venue recognised in the MICHELIN Guide 2026. Kindly share your preferred evening, and we will arrange the details.

We look forward to welcoming you.

Remarkably yours,
Richard Adrian Mehr
General Manager, Chatrium Rawai Phuket`;

describe("runQCChecks", () => {
  it("passes all checks on a clean draft", () => {
    const qc = runQCChecks({
      body: CLEAN_DRAFT,
      recipientContext: "Ms. Chen, Diamond member, honeymoon",
    });
    expect(qc.no_em_dash).toBe(true);
    expect(qc.no_slang).toBe(true);
    expect(qc.cta_present).toBe(true);
    expect(qc.loyalty_recognised).toBe(true);
    expect(qc.length_ok).toBe(true);
    expect(anyCriticalQCFailed(qc)).toBe(false);
  });

  it("flags em-dashes", () => {
    const qc = runQCChecks({
      body: CLEAN_DRAFT.replace(", 24 to 28 April,", " — 24 to 28 April —"),
      recipientContext: "Ms. Chen, Diamond member",
    });
    expect(qc.no_em_dash).toBe(false);
    expect(anyCriticalQCFailed(qc)).toBe(true);
  });

  it("flags slang words", () => {
    const qc = runQCChecks({
      body: `Hey there! This is gonna be super awesome — thanks for booking.\n\nKindly confirm.`,
      recipientContext: "",
    });
    expect(qc.no_slang).toBe(false);
  });

  it("flags missing CTA in final paragraph", () => {
    const qc = runQCChecks({
      body: `Dear Ms. Chen,\n\nYour reservation is noted for five nights. We appreciate your patronage.\n\nRemarkably yours,\nThe team`,
      recipientContext: "",
    });
    expect(qc.cta_present).toBe(false);
  });

  it("requires loyalty reference when context mentions tier", () => {
    const qc = runQCChecks({
      body: `Dear Ms. Chen,\n\nThank you for choosing Chatrium Rawai Phuket for this meaningful stay. Your reservation is confirmed for five nights. Kindly advise any preferences for your arrival.\n\nWe look forward to welcoming you.`,
      recipientContext: "Ms. Chen, Diamond member",
    });
    expect(qc.loyalty_recognised).toBe(false);
  });

  it("does not require loyalty reference when context omits tier", () => {
    const qc = runQCChecks({
      body: `Dear Ms. Chen,\n\nThank you for choosing Chatrium Rawai Phuket. Your reservation is confirmed. Please confirm your preferred arrival time.\n\nWe look forward to welcoming you.`,
      recipientContext: "Ms. Chen, first-time guest",
    });
    expect(qc.loyalty_recognised).toBe(true);
  });

  it("flags drafts under 60 words", () => {
    const qc = runQCChecks({
      body: `Dear Ms. Chen, Your booking is confirmed. Please reply to confirm. Thanks.`,
      recipientContext: "",
    });
    expect(qc.length_ok).toBe(false);
  });
});
