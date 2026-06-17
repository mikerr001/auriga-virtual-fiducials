import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, validationRunsTable, calibrationProfilesTable } from "@workspace/db";
import {
  CreateValidationRunBody,
  GetValidationRunParams,
} from "@workspace/api-zod";
import { generateValidationCases } from "../lib/geometry";

const router: IRouter = Router();

router.get("/validation/runs", async (_req, res): Promise<void> => {
  const runs = await db
    .select()
    .from(validationRunsTable)
    .orderBy(desc(validationRunsTable.createdAt));
  res.json(runs);
});

router.post("/validation/runs", async (req, res): Promise<void> => {
  const parsed = CreateValidationRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db
    .select()
    .from(calibrationProfilesTable)
    .where(eq(calibrationProfilesTable.id, parsed.data.calibrationProfileId));

  if (!profile) {
    res.status(400).json({ error: "Calibration profile not found" });
    return;
  }

  const results = generateValidationCases(
    {
      focalLengthPx: profile.focalLengthPx,
      markerSizeMm: profile.markerSizeMm,
      sensorWidthPx: profile.sensorWidthPx,
      sensorHeightPx: profile.sensorHeightPx,
    },
    parsed.data.testType,
    parsed.data.totalCases
  );

  const [run] = await db
    .insert(validationRunsTable)
    .values({
      name: parsed.data.name,
      testType: parsed.data.testType,
      calibrationProfileId: parsed.data.calibrationProfileId,
      totalCases: parsed.data.totalCases,
      passedCases: results.passedCases,
      failedCases: results.failedCases,
      passRate: results.passRate,
      status: "completed",
      avgEstimatedDistanceM: results.avgEstimatedDistanceM,
      avgConfidenceScore: results.avgConfidenceScore,
      mae: results.mae,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(run);
});

router.get("/validation/runs/:id", async (req, res): Promise<void> => {
  const params = GetValidationRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [run] = await db
    .select()
    .from(validationRunsTable)
    .where(eq(validationRunsTable.id, params.data.id));
  if (!run) {
    res.status(404).json({ error: "Validation run not found" });
    return;
  }
  res.json(run);
});

export default router;
