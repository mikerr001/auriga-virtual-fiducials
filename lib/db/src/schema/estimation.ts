import { pgTable, serial, integer, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const estimationResultsTable = pgTable("estimation_results", {
  id: serial("id").primaryKey(),
  calibrationProfileId: integer("calibration_profile_id").notNull(),
  datasetId: integer("dataset_id"),
  method: text("method").notNull().default("pinhole"),
  markerPixelWidth: real("marker_pixel_width").notNull(),
  markerPixelHeight: real("marker_pixel_height"),
  measuredDistanceM: real("measured_distance_m"),
  estimatedDistanceM: real("estimated_distance_m").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  uncertaintyM: real("uncertainty_m").notNull(),
  confidenceLowerM: real("confidence_lower_m").notNull(),
  confidenceUpperM: real("confidence_upper_m").notNull(),
  lightingCondition: text("lighting_condition"),
  partialOcclusion: boolean("partial_occlusion").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEstimationResultSchema = createInsertSchema(estimationResultsTable).omit({ id: true, createdAt: true });
export type InsertEstimationResult = z.infer<typeof insertEstimationResultSchema>;
export type EstimationResult = typeof estimationResultsTable.$inferSelect;
