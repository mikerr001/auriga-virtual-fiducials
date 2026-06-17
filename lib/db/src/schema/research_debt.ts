import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const researchDebtTable = pgTable("research_debt", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  category: text("category").notNull().default("other"),
  relatedCalibrationProfileId: integer("related_calibration_profile_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResearchDebtSchema = createInsertSchema(researchDebtTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResearchDebt = z.infer<typeof insertResearchDebtSchema>;
export type ResearchDebt = typeof researchDebtTable.$inferSelect;
