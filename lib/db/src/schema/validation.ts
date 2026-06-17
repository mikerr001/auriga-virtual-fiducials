import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const validationRunsTable = pgTable("validation_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  testType: text("test_type").notNull().default("standard"),
  calibrationProfileId: integer("calibration_profile_id").notNull(),
  totalCases: integer("total_cases").notNull(),
  passedCases: integer("passed_cases").notNull().default(0),
  failedCases: integer("failed_cases").notNull().default(0),
  passRate: real("pass_rate").notNull().default(0),
  status: text("status").notNull().default("running"),
  avgEstimatedDistanceM: real("avg_estimated_distance_m"),
  avgConfidenceScore: real("avg_confidence_score"),
  mae: real("mae"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertValidationRunSchema = createInsertSchema(validationRunsTable).omit({ id: true, createdAt: true });
export type InsertValidationRun = z.infer<typeof insertValidationRunSchema>;
export type ValidationRun = typeof validationRunsTable.$inferSelect;
