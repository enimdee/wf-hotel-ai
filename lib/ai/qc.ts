import type { QCReport } from "@/lib/schemas";

const EM_DASH = "\u2014";

const SLANG_WORDS = [
  "cool",
  "awesome",
  "totally",
  "super",
  "amazing",
  "wow",
  "yeah",
  "yep",
  "nope",
  "hey",
  "gonna",
  "wanna",
  "gotta",
  "kinda",
  "sorta",
  "stuff",
];

const CTA_VERBS = [
  "confirm",
  "share",
  "let us know",
  "kindly",
  "please",
  "reply",
  "respond",
  "reach out",
  "contact",
  "advise",
  "inform",
  "reserve",
  "arrange",
];

const LOYALTY_KEYWORDS = [
  "diamond",
  "platinum",
  "gold",
  "silver",
];

export interface QCInput {
  body: string;
  recipientContext: string;
}

export function runQCChecks({ body, recipientContext }: QCInput): QCReport {
  const bodyLower = body.toLowerCase();
  const contextLower = recipientContext.toLowerCase();

  const no_em_dash = !body.includes(EM_DASH);

  const no_slang = !SLANG_WORDS.some((w) => {
    const re = new RegExp(`\\b${w}\\b`, "i");
    return re.test(body);
  });

  const lastParagraph = body.split(/\n\s*\n/).filter(Boolean).slice(-1)[0] ?? body;
  const cta_present = CTA_VERBS.some((v) => lastParagraph.toLowerCase().includes(v));

  const hasLoyaltyContext = LOYALTY_KEYWORDS.some((k) => contextLower.includes(k));
  const bodyMentionsLoyalty = LOYALTY_KEYWORDS.some((k) => bodyLower.includes(k)) ||
    /\bmember(ship)?\b/i.test(body) ||
    /\bloyalty\b/i.test(body);
  const loyalty_recognised = hasLoyaltyContext ? bodyMentionsLoyalty : true;

  const wordCount = body.trim().split(/\s+/).length;
  const length_ok = wordCount >= 60 && wordCount <= 350;

  return { no_em_dash, no_slang, cta_present, loyalty_recognised, length_ok };
}

export function anyCriticalQCFailed(qc: QCReport): boolean {
  return !qc.no_em_dash || !qc.no_slang || !qc.cta_present || !qc.loyalty_recognised;
}

export function formatQCCorrective(qc: QCReport): string {
  const issues: string[] = [];
  if (!qc.no_em_dash) issues.push("- Remove all em-dashes (—). Use commas, semicolons, or full stops instead.");
  if (!qc.no_slang) issues.push("- Remove casual words like 'cool', 'awesome', 'totally'. Keep the register warm but formal.");
  if (!qc.cta_present) issues.push("- End with a clear call to action (confirm, share, let us know).");
  if (!qc.loyalty_recognised) issues.push("- The recipient is a loyalty member — acknowledge their tier or membership.");
  if (!qc.length_ok) issues.push("- Keep the body between 60 and 350 words.");
  return `Please revise the draft to address the following:\n${issues.join("\n")}`;
}
