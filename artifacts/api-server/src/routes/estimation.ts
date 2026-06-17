import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, estimationResultsTable, calibrationProfilesTable } from "@workspace/db";
import {
  RunEstimationBody,
  GetEstimationResultParams,
} from "@workspace/api-zod";
import { estimateDistancePinhole } from "../lib/geometry";

const router: IRouter = Router();

router.post("/estimation/run", async (req, res): Promise<void> => {
  const parsed = RunEstimationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const profileId = typeof parsed.data.calibrationProfileId === "number"
    ? parsed.data.calibrationProfileId
    : parseInt(String(parsed.data.calibrationProfileId), 10);

  const [profile] = await db
    .select()
    .from(calibrationProfilesTable)
    .where(eq(calibrationProfilesTable.id, profileId));

  if (!profile) {
    res.status(400).json({ error: "Calibration profile not found" });
    return;
  }

  const geometry = estimateDistancePinhole({
    focalLengthPx: profile.focalLengthPx,
    markerSizeMm: profile.markerSizeMm,
    sensorWidthPx: profile.sensorWidthPx,
    sensorHeightPx: profile.sensorHeightPx,
    markerPixelWidth: parsed.data.markerPixelWidth,
    markerPixelHeight: parsed.data.markerPixelHeight,
    lightingCondition: parsed.data.lightingCondition,
    partialOcclusion: parsed.data.partialOcclusion,
  });

  const [result] = await db
    .insert(estimationResultsTable)
    .values({
      calibrationProfileId: profileId,
      datasetId: parsed.data.datasetId ?? null,
      method: parsed.data.method,
      markerPixelWidth: parsed.data.markerPixelWidth,
      markerPixelHeight: parsed.data.markerPixelHeight ?? null,
      measuredDistanceM: parsed.data.measuredDistanceM ?? null,
      estimatedDistanceM: geometry.estimatedDistanceM,
      confidenceScore: geometry.confidenceScore,
      uncertaintyM: geometry.uncertaintyM,
      confidenceLowerM: geometry.confidenceLowerM,
      confidenceUpperM: geometry.confidenceUpperM,
      lightingCondition: parsed.data.lightingCondition ?? null,
      partialOcclusion: parsed.data.partialOcclusion ?? false,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(result);
});

router.get("/estimation/results", async (_req, res): Promise<void> => {
  const results = await db
    .select()
    .from(estimationResultsTable)
    .orderBy(estimationResultsTable.createdAt);
  res.json(results);
});

router.get("/estimation/results/:id", async (req, res): Promise<void> => {
  const params = GetEstimationResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [result] = await db
    .select()
    .from(estimationResultsTable)
    .where(eq(estimationResultsTable.id, params.data.id));
  if (!result) {
    res.status(404).json({ error: "Estimation result not found" });
    return;
  }
  res.json(result);
});

export default router;
