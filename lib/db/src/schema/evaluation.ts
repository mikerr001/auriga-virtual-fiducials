import { pgTable, serial, integer, real, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evaluationReportsTable = pgTable("evaluation_reports", {
  id: serial("id").primaryKey(),
  datasetId: integer("dataset_id").notNull(),
  calibrationProfileId: integer("calibration_profile_id").notNull(),
  sampleCount: integer("sample_count").notNull(),
  mae: real("mae").notNull(),
  rmse: real("rmse").notNull(),
  mape: real("mape").notNull(),
  driftDetected: boolean("drift_detected").notNull().default(false),
  driftMagnitude: real("drift_magnitude"),
  minErrorM: real("min_error_m").notNull(),
  maxErrorM: real("max_error_m").notNull(),
  meanEstimatedDistanceM: real("mean_estimated_distance_m").notNull(),
  meanMeasuredDistanceM: real("mean_measured_distance_m").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEvaluationReportSchema = createInsertSchema(evaluationReportsTable).omit({ id: true, createdAt: true });
export type InsertEvaluationReport = z.infer<typeof insertEvaluationReportSchema>;
export type EvaluationReport = typeof evaluationReportsTable.$inferSelect;
