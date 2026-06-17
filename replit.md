# Auriga Virtual Fiducial Engine

A production-grade monocular distance estimation dashboard for the Auriga offline-first assistive navigation ecosystem. Researchers use it to manage camera calibration profiles, run geometric distance estimations, evaluate accuracy metrics (MAE/RMSE/MAPE), track synthetic validation results, and log research debt.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/auriga-dashboard run dev` — run the dashboard frontend (port 21961)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui + wouter + TanStack Query

## Where things live

- **API spec**: `lib/api-spec/openapi.yaml` — single source of truth
- **DB schema**: `lib/db/src/schema/` — one file per domain
- **Geometry engine**: `artifacts/api-server/src/lib/geometry.ts` — pinhole model, metrics, drift detection, validation case generation
- **API routes**: `artifacts/api-server/src/routes/` — calibration, datasets, estimation, evaluation, research_debt, validation
- **Frontend pages**: `artifacts/auriga-dashboard/src/pages/` — dashboard, calibration, estimation, datasets, evaluation, research-debt, validation
- **Generated hooks**: `lib/api-client-react/src/generated/` — do not edit
- **Generated Zod schemas**: `lib/api-zod/src/generated/` — do not edit

## Architecture decisions

- **Pinhole camera model** for distance estimation: `D = (S_mm × f_px) / W_px / 1000`. Confidence scoring accounts for aspect ratio consistency, marker size relative to sensor, lighting condition, and partial occlusion.
- **Synthetic evaluation fallback**: When no estimation results with `measuredDistanceM` exist for a dataset, the evaluation pipeline generates synthetic ground-truth pairs. This is flagged in the research debt ledger as a known issue requiring an explicit `SYNTHETIC_BASELINE` flag.
- **Drift detection threshold**: 15% MAE change triggers drift — empirical heuristic, not a principled statistical test (see research debt entry).
- **Offline-first**: No external services. All computation is pure TypeScript geometry in the API server.
- **Research Debt as first-class entity**: Known unresolved issues are stored in the DB, not in comments.

## Product

- **Engine Overview**: Real-time telemetry — evaluation summary, calibration drift alerts, critical research debt count, recent estimation results
- **Calibration Profiles**: CRUD for camera intrinsic parameters (focal length, sensor dimensions, marker size, marker type)
- **Distance Estimation**: Run pinhole/PnP/homography estimations, view confidence intervals and uncertainty bands
- **Dataset Registry**: Register and manage approved datasets (data-factory, synthetic, manual, external)
- **Evaluation Reports**: Generate MAE/RMSE/MAPE reports per dataset+profile pair; automatic drift detection vs prior baseline
- **Research Debt Ledger**: Track open research issues by severity (critical/high/medium/low) and category
- **Synthetic Validation**: Run lighting-variation, reflective-environment, partial-occlusion, adversarial, and standard test suites

## User preferences

_Populate as you build._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml` before writing route code — the Zod schema names (e.g. `CreateCalibrationProfileBody`) are auto-derived by Orval and may not match intuition.
- `detectDrift()` in `geometry.ts` uses a 15% MAE threshold — see research debt for why this is fragile.
- The evaluation route falls back to synthetic data when no ground-truth estimation results exist. This produces misleadingly low MAE and should be flagged in reports.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
