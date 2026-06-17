import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const calibrationProfilesTable = pgTable("calibration_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  focalLengthPx: real("focal_length_px").notNull(),
  sensorWidthPx: integer("sensor_width_px").notNull(),
  sensorHeightPx: integer("sensor_height_px").notNull(),
  markerSizeMm: real("marker_size_mm").notNull(),
  cameraModel: text("camera_model").notNull(),
  markerType: text("marker_type").notNull().default("aruco"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCalibrationProfileSchema = createInsertSchema(calibrationProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCalibrationProfile = z.infer<typeof insertCalibrationProfileSchema>;
export type CalibrationProfile = typeof calibrationProfilesTable.$inferSelect;
