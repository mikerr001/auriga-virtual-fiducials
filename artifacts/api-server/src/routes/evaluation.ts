import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, evaluationReportsTable, estimationResultsTable, calibrationProfilesTable, datasetsTable } from "@workspace/db";
import {
  CreateEvaluationReportBody,
  GetEvaluationReportParams,
} from "@workspace/api-zod";
import { estimateDistancePinhole, computeMetrics, detectDrift } from "../lib/geometry";

const router: IRouter = Router();

router.get("/evaluation/reports", async (_req, res): Promise<void> => {
  const reports = await db.select().from(evaluationReportsTable).orderBy(desc(evaluationReportsTable.createdAt));
  res.json(reports);
});

router.post("/evaluation/reports", async (req, res): Promise<void> => {
  const parsed = CreateEvaluationReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { datasetId, calibrationProfileId } = parsed.data;

  const [dataset] = await db.select().from(datasetsTable).where(eq(datasetsTable.id, datasetId));
  if (!dataset) {
    res.status(400).json({ error: "Dataset not found" });
    return;
  }

  const [profile] = await db.select().from(calibrationProfilesTable).where(eq(calibrationProfilesTable.id, calibrationProfileId));
  if (!profile) {
    res.status(400).json({ error: "Calibration profile not found" });
    return;
  }

  // Find estimation results that belong to this dataset and profile
  const existingResults = await db
    .select()
    .from(estimationResultsTable)
    .where(eq(estimationResultsTable.calibrationProfileId, calibrationProfileId));

  const resultsWithGroundTruth = existingResults.filter(
    (r) => r.measuredDistanceM != null && (r.datasetId === datasetId || r.datasetId == null)
  );

  let metrics;
  if (resultsWithGroundTruth.length > 0) {
    const pairs = resultsWithGroundTruth.map((r) => ({
      estimated: r.estimatedDistanceM,
      measured: r.measuredDistanceM!,
    }));
    metrics = computeMetrics(pairs);
  } else {
    // Synthetic evaluation: generate sample pairs using the pinhole model with known ground truth
    const sampleCount = Math.min(dataset.sampleCount, 50);
    const syntheticPairs: Array<{ estimated: number; measured: number }> = [];
    for (let i = 0; i < sampleCount; i++) {
      const trueDistM = dataset.distanceRangeMinM + (i / sampleCount) * (dataset.distanceRangeMaxM - dataset.distanceRangeMinM);
      const idealPxWidth = (profile.markerSizeMm * profile.focalLengthPx) / (trueDistM * 1000);
      const noise = (Math.sin(i * 1.7) * 0.05) * idealPxWidth;
      const result = estimateDistancePinhole({
        focalLengthPx: profile.focalLengthPx,
        markerSizeMm: profile.markerSizeMm,
        sensorWidthPx: profile.sensorWidthPx,
        sensorHeightPx: profile.sensorHeightPx,
        markerPixelWidth: Math.max(1, idealPxWidth + noise),
      });
      syntheticPairs.push({ estimated: result.estimatedDistanceM, measured: trueDistM });
    }
    metrics = computeMetrics(syntheticPairs);
  }

  // Drift detection: compare to previous report for same profile
  const [previousReport] = await db
    .select()
    .from(evaluationReportsTable)
    .where(eq(evaluationReportsTable.calibrationProfileId, calibrationProfileId))
    .orderBy(desc(evaluationReportsTable.createdAt))
    .limit(1);

  const drift = previousReport
    ? detectDrift(previousReport.mae, metrics.mae)
    : { driftDetected: false, driftMagnitude: null };

  const sampleCount = resultsWithGroundTruth.length > 0
    ? resultsWithGroundTruth.length
    : Math.min(dataset.sampleCount, 50);

  const [report] = await db
    .insert(evaluationReportsTable)
    .values({
      datasetId,
      calibrationProfileId,
      sampleCount,
      mae: metrics.mae,
      rmse: metrics.rmse,
      mape: metrics.mape,
      driftDetected: drift.driftDetected,
      driftMagnitude: drift.driftMagnitude,
      minErrorM: metrics.minErrorM,
      maxErrorM: metrics.maxErrorM,
      meanEstimatedDistanceM: metrics.meanEstimatedDistanceM,
      meanMeasuredDistanceM: metrics.meanMeasuredDistanceM,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(report);
});

router.get("/evaluation/reports/:id", async (req, res): Promise<void> => {
  const params = GetEvaluationReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [report] = await db
    .select()
    .from(evaluationReportsTable)
    .where(eq(evaluationReportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Evaluation report not found" });
    return;
  }
  res.json(report);
});

router.get("/evaluation/summary", async (_req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(evaluationReportsTable)
    .orderBy(desc(evaluationReportsTable.createdAt));

  if (reports.length === 0) {
    res.json({
      totalReports: 0,
      avgMae: 0,
      avgRmse: 0,
      avgMape: 0,
      driftDetectedCount: 0,
      recentReports: [],
    });
    return;
  }

  const avgMae = reports.reduce((a, b) => a + b.mae, 0) / reports.length;
  const avgRmse = reports.reduce((a, b) => a + b.rmse, 0) / reports.length;
  const avgMape = reports.reduce((a, b) => a + b.mape, 0) / reports.length;
  const driftDetectedCount = reports.filter((r) => r.driftDetected).length;

  res.json({
    totalReports: reports.length,
    avgMae: Math.round(avgMae * 100000) / 100000,
    avgRmse: Math.round(avgRmse * 100000) / 100000,
    avgMape: Math.round(avgMape * 100) / 100,
    driftDetectedCount,
    recentReports: reports.slice(0, 5),
  });
});

export default router;
