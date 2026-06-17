/**
 * Auriga Virtual Fiducial Engine — Geometric Distance Estimation
 *
 * Implements the pinhole camera model for monocular distance estimation:
 *
 *   D = (S_mm * f_px) / W_px
 *
 * Where:
 *   D      = estimated distance in metres
 *   S_mm   = physical marker size in millimetres
 *   f_px   = focal length in pixels
 *   W_px   = detected marker width in pixels
 *
 * Confidence scoring accounts for:
 *   - Aspect ratio consistency (when height is available)
 *   - Marker size relative to sensor (very small or very large markers degrade confidence)
 *   - Lighting condition penalties
 *   - Partial occlusion penalties
 */

export interface EstimationInputGeometry {
  focalLengthPx: number;
  markerSizeMm: number;
  sensorWidthPx: number;
  sensorHeightPx: number;
  markerPixelWidth: number;
  markerPixelHeight?: number | null;
  lightingCondition?: string | null;
  partialOcclusion?: boolean;
}

export interface EstimationOutputGeometry {
  estimatedDistanceM: number;
  confidenceScore: number;
  uncertaintyM: number;
  confidenceLowerM: number;
  confidenceUpperM: number;
}

/**
 * Pinhole camera model: D = (S_mm * f_px) / W_px / 1000
 */
export function estimateDistancePinhole(input: EstimationInputGeometry): EstimationOutputGeometry {
  const { focalLengthPx, markerSizeMm, sensorWidthPx, sensorHeightPx, markerPixelWidth, markerPixelHeight, lightingCondition, partialOcclusion } = input;

  const estimatedDistanceM = (markerSizeMm * focalLengthPx) / markerPixelWidth / 1000;

  let confidence = 1.0;

  // Aspect ratio check — square markers should have consistent pixel dimensions
  if (markerPixelHeight != null && markerPixelHeight > 0) {
    const aspectRatio = markerPixelWidth / markerPixelHeight;
    // Perfect square = 1.0; penalty grows with deviation
    const aspectPenalty = Math.abs(1.0 - aspectRatio) * 0.3;
    confidence -= Math.min(aspectPenalty, 0.3);
  }

  // Marker size relative to sensor width — tiny markers are noisy, huge markers suggest clipping
  const markerFraction = markerPixelWidth / sensorWidthPx;
  if (markerFraction < 0.02) {
    // Very small marker — high pixel-level noise
    confidence -= 0.25;
  } else if (markerFraction < 0.05) {
    confidence -= 0.10;
  } else if (markerFraction > 0.8) {
    // Marker fills most of frame — likely very close, potential clipping
    confidence -= 0.15;
  }

  // Lighting condition penalties
  if (lightingCondition === "low-light") {
    confidence -= 0.20;
  } else if (lightingCondition === "reflective") {
    confidence -= 0.25;
  } else if (lightingCondition === "bright") {
    confidence -= 0.05;
  }

  // Partial occlusion penalty
  if (partialOcclusion) {
    confidence -= 0.30;
  }

  // Clamp confidence to [0.05, 1.0]
  confidence = Math.max(0.05, Math.min(1.0, confidence));

  // Uncertainty scales inversely with confidence
  // Base uncertainty: ±5% of estimated distance, inflated by low confidence
  const baseUncertaintyFraction = 0.05;
  const confidenceInflation = 1 + (1 - confidence) * 2;
  const uncertaintyM = estimatedDistanceM * baseUncertaintyFraction * confidenceInflation;

  return {
    estimatedDistanceM,
    confidenceScore: Math.round(confidence * 1000) / 1000,
    uncertaintyM: Math.round(uncertaintyM * 10000) / 10000,
    confidenceLowerM: Math.max(0, Math.round((estimatedDistanceM - uncertaintyM) * 10000) / 10000),
    confidenceUpperM: Math.round((estimatedDistanceM + uncertaintyM) * 10000) / 10000,
  };
}

/**
 * Evaluation metrics — MAE, RMSE, MAPE
 */
export function computeMetrics(pairs: Array<{ estimated: number; measured: number }>): {
  mae: number;
  rmse: number;
  mape: number;
  minErrorM: number;
  maxErrorM: number;
  meanEstimatedDistanceM: number;
  meanMeasuredDistanceM: number;
} {
  if (pairs.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, minErrorM: 0, maxErrorM: 0, meanEstimatedDistanceM: 0, meanMeasuredDistanceM: 0 };
  }

  const absErrors = pairs.map(p => Math.abs(p.estimated - p.measured));
  const squaredErrors = pairs.map(p => Math.pow(p.estimated - p.measured, 2));
  const pctErrors = pairs.map(p => Math.abs((p.estimated - p.measured) / p.measured) * 100);

  const mae = absErrors.reduce((a, b) => a + b, 0) / pairs.length;
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / pairs.length);
  const mape = pctErrors.reduce((a, b) => a + b, 0) / pairs.length;
  const minErrorM = Math.min(...absErrors);
  const maxErrorM = Math.max(...absErrors);
  const meanEstimatedDistanceM = pairs.reduce((a, b) => a + b.estimated, 0) / pairs.length;
  const meanMeasuredDistanceM = pairs.reduce((a, b) => a + b.measured, 0) / pairs.length;

  return {
    mae: Math.round(mae * 100000) / 100000,
    rmse: Math.round(rmse * 100000) / 100000,
    mape: Math.round(mape * 100) / 100,
    minErrorM: Math.round(minErrorM * 100000) / 100000,
    maxErrorM: Math.round(maxErrorM * 100000) / 100000,
    meanEstimatedDistanceM: Math.round(meanEstimatedDistanceM * 10000) / 10000,
    meanMeasuredDistanceM: Math.round(meanMeasuredDistanceM * 10000) / 10000,
  };
}

/**
 * Drift detection — compares current baseline MAE against historical reports
 * Returns drift magnitude (%) if drift threshold exceeded (>15% change).
 */
export function detectDrift(baselineMae: number, currentMae: number): { driftDetected: boolean; driftMagnitude: number | null } {
  if (baselineMae === 0) return { driftDetected: false, driftMagnitude: null };
  const changePct = Math.abs((currentMae - baselineMae) / baselineMae) * 100;
  return {
    driftDetected: changePct > 15,
    driftMagnitude: Math.round(changePct * 100) / 100,
  };
}

/**
 * Synthetic validation — generates adversarial test cases for a given profile
 */
export function generateValidationCases(
  profile: { focalLengthPx: number; markerSizeMm: number; sensorWidthPx: number; sensorHeightPx: number },
  testType: string,
  totalCases: number
): { passedCases: number; failedCases: number; passRate: number; mae: number; avgEstimatedDistanceM: number; avgConfidenceScore: number } {
  const results: EstimationOutputGeometry[] = [];
  const errors: number[] = [];
  const groundTruths: number[] = [];

  for (let i = 0; i < totalCases; i++) {
    // Generate a range of marker pixel widths simulating different distances
    const trueDistanceM = 0.5 + (i / totalCases) * 9.5; // 0.5m to 10m
    const idealPixelWidth = (profile.markerSizeMm * profile.focalLengthPx) / (trueDistanceM * 1000);

    // Add noise based on test type
    let noise = 0;
    let lightingCondition: string | null = null;
    let partialOcclusion = false;

    if (testType === "lighting-variation") {
      const conditions = ["normal", "low-light", "bright", "reflective"] as const;
      lightingCondition = conditions[i % conditions.length];
      noise = (Math.random() - 0.5) * idealPixelWidth * 0.1;
    } else if (testType === "reflective-environment") {
      lightingCondition = "reflective";
      noise = (Math.random() - 0.5) * idealPixelWidth * 0.2;
    } else if (testType === "partial-occlusion") {
      partialOcclusion = true;
      noise = (Math.random() - 0.5) * idealPixelWidth * 0.15;
    } else if (testType === "adversarial") {
      noise = (Math.random() - 0.5) * idealPixelWidth * 0.3;
      lightingCondition = Math.random() > 0.5 ? "reflective" : "low-light";
      partialOcclusion = Math.random() > 0.7;
    } else {
      noise = (Math.random() - 0.5) * idealPixelWidth * 0.05;
    }

    const noisyPixelWidth = Math.max(1, idealPixelWidth + noise);
    const result = estimateDistancePinhole({
      ...profile,
      markerPixelWidth: noisyPixelWidth,
      lightingCondition,
      partialOcclusion,
    });

    results.push(result);
    groundTruths.push(trueDistanceM);
    errors.push(Math.abs(result.estimatedDistanceM - trueDistanceM));
  }

  // Pass criterion: absolute error < 0.3m AND confidence > 0.4
  const passThreshold = { errorM: 0.3, confidence: 0.4 };
  const passed = results.filter((r, i) => errors[i] < passThreshold.errorM && r.confidenceScore > passThreshold.confidence).length;
  const failed = totalCases - passed;
  const passRate = Math.round((passed / totalCases) * 10000) / 100;
  const mae = Math.round((errors.reduce((a, b) => a + b, 0) / errors.length) * 100000) / 100000;
  const avgEstimatedDistanceM = Math.round((results.reduce((a, b) => a + b.estimatedDistanceM, 0) / results.length) * 10000) / 10000;
  const avgConfidenceScore = Math.round((results.reduce((a, b) => a + b.confidenceScore, 0) / results.length) * 1000) / 1000;

  return { passedCases: passed, failedCases: failed, passRate, mae, avgEstimatedDistanceM, avgConfidenceScore };
}
