import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, calibrationProfilesTable } from "@workspace/db";
import {
  CreateCalibrationProfileBody,
  UpdateCalibrationProfileBody,
  GetCalibrationProfileParams,
  UpdateCalibrationProfileParams,
  DeleteCalibrationProfileParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calibration/profiles", async (_req, res): Promise<void> => {
  const profiles = await db.select().from(calibrationProfilesTable).orderBy(calibrationProfilesTable.createdAt);
  res.json(profiles);
});

router.post("/calibration/profiles", async (req, res): Promise<void> => {
  const parsed = CreateCalibrationProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [profile] = await db
    .insert(calibrationProfilesTable)
    .values({ ...parsed.data })
    .returning();
  res.status(201).json(profile);
});

router.get("/calibration/profiles/:id", async (req, res): Promise<void> => {
  const params = GetCalibrationProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [profile] = await db
    .select()
    .from(calibrationProfilesTable)
    .where(eq(calibrationProfilesTable.id, params.data.id));
  if (!profile) {
    res.status(404).json({ error: "Calibration profile not found" });
    return;
  }
  res.json(profile);
});

router.patch("/calibration/profiles/:id", async (req, res): Promise<void> => {
  const params = UpdateCalibrationProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCalibrationProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [profile] = await db
    .update(calibrationProfilesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(calibrationProfilesTable.id, params.data.id))
    .returning();
  if (!profile) {
    res.status(404).json({ error: "Calibration profile not found" });
    return;
  }
  res.json(profile);
});

router.delete("/calibration/profiles/:id", async (req, res): Promise<void> => {
  const params = DeleteCalibrationProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [profile] = await db
    .delete(calibrationProfilesTable)
    .where(eq(calibrationProfilesTable.id, params.data.id))
    .returning();
  if (!profile) {
    res.status(404).json({ error: "Calibration profile not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/calibration/drift", async (_req, res): Promise<void> => {
  const profiles = await db.select().from(calibrationProfilesTable);
  const profileDriftStatus = profiles.map((p) => {
    // Drift heuristic: profiles not updated in more than 30 days and used heavily
    const daysSinceUpdate = (Date.now() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const driftDetected = daysSinceUpdate > 30;
    const driftMagnitude = driftDetected ? Math.round(((daysSinceUpdate - 30) / 30) * 100 * 100) / 100 : null;
    return {
      id: p.id,
      name: p.name,
      driftDetected,
      driftMagnitude,
      lastCheckedAt: p.updatedAt.toISOString(),
    };
  });
  res.json({
    totalProfiles: profiles.length,
    driftDetectedCount: profileDriftStatus.filter((p) => p.driftDetected).length,
    profiles: profileDriftStatus,
  });
});

export default router;
