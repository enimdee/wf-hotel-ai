import {
  bigint,
  char,
  datetime,
  decimal,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }),
    role: varchar("role", { length: 60 }).notNull().default("staff"),
    property: varchar("property", { length: 60 }).notNull().default("rawai"),
    isActive: tinyint("is_active").notNull().default(1),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastLoginAt: datetime("last_login_at"),
  },
  (t) => ({
    emailUniq: uniqueIndex("uniq_users_email").on(t.email),
  }),
);

export const loginTokens = mysqlTable(
  "login_tokens",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: char("token_hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at").notNull(),
    used: tinyint("used").notNull().default(0),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    userIdx: index("idx_login_tokens_user").on(t.userId),
    hashIdx: index("idx_login_tokens_hash").on(t.tokenHash),
  }),
);

export const brandVoicePrompts = mysqlTable(
  "brand_voice_prompts",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    version: varchar("version", { length: 20 }).notNull(),
    promptText: mediumtext("prompt_text").notNull(),
    isActive: tinyint("is_active").notNull().default(0),
    notes: varchar("notes", { length: 500 }),
    createdBy: varchar("created_by", { length: 120 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    versionUniq: uniqueIndex("uniq_prompt_version").on(t.version),
  }),
);

export const drafts = mysqlTable(
  "drafts",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    draftUid: char("draft_uid", { length: 26 }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    property: varchar("property", { length: 60 }).notNull(),
    taskType: varchar("task_type", { length: 40 }).notNull(),
    recipientName: varchar("recipient_name", { length: 200 }),
    recipientContext: text("recipient_context"),
    inputLanguage: mysqlEnum("input_language", ["th", "en"]).notNull().default("en"),
    objective: text("objective").notNull(),
    additionalNotes: text("additional_notes"),
    templateId: bigint("template_id", { mode: "number", unsigned: true }),
    promptVersion: varchar("prompt_version", { length: 20 }).notNull(),
    generatedSubject: varchar("generated_subject", { length: 255 }),
    generatedBody: mediumtext("generated_body"),
    qcNoEmDash: tinyint("qc_no_em_dash").notNull().default(1),
    qcNoSlang: tinyint("qc_no_slang").notNull().default(1),
    qcCtaPresent: tinyint("qc_cta_present").notNull().default(1),
    qcLoyaltyOk: tinyint("qc_loyalty_ok").notNull().default(1),
    qcLengthOk: tinyint("qc_length_ok").notNull().default(1),
    inputTokens: int("input_tokens", { unsigned: true }),
    cachedInputTokens: int("cached_input_tokens", { unsigned: true }),
    outputTokens: int("output_tokens", { unsigned: true }),
    estimatedCostThb: decimal("estimated_cost_thb", { precision: 8, scale: 4 }),
    latencyMs: int("latency_ms", { unsigned: true }),
    model: varchar("model", { length: 60 }).notNull().default("claude-sonnet-4-6"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    draftUidUniq: uniqueIndex("uniq_draft_uid").on(t.draftUid),
    userCreatedIdx: index("idx_drafts_user_created").on(t.userId, t.createdAt),
    recipientIdx: index("idx_drafts_recipient").on(t.recipientName),
  }),
);

export const templates = mysqlTable("templates", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 255 }),
  taskType: varchar("task_type", { length: 40 }).notNull(),
  propertyScope: varchar("property_scope", { length: 60 }),
  body: mediumtext("body").notNull(),
  isActive: tinyint("is_active").notNull().default(1),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLog = mysqlTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
    action: varchar("action", { length: 60 }).notNull(),
    draftUid: char("draft_uid", { length: 26 }),
    severity: mysqlEnum("severity", ["info", "warn", "error"]).notNull().default("info"),
    metadata: json("metadata"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    userCreatedIdx: index("idx_audit_user_created").on(t.userId, t.createdAt),
    actionCreatedIdx: index("idx_audit_action_created").on(t.action, t.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type BrandVoicePrompt = typeof brandVoicePrompts.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
