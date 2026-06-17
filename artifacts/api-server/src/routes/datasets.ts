import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, datasetsTable } from "@workspace/db";
import {
  CreateDatasetBody,
  GetDatasetParams,
  DeleteDatasetParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/datasets", async (_req, res): Promise<void> => {
  const datasets = await db.select().from(datasetsTable).orderBy(datasetsTable.createdAt);
  res.json(datasets);
});

router.post("/datasets", async (req, res): Promise<void> => {
  const parsed = CreateDatasetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [dataset] = await db.insert(datasetsTable).values({ ...parsed.data }).returning();
  res.status(201).json(dataset);
});

router.get("/datasets/:id", async (req, res): Promise<void> => {
  const params = GetDatasetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dataset] = await db.select().from(datasetsTable).where(eq(datasetsTable.id, params.data.id));
  if (!dataset) {
    res.status(404).json({ error: "Dataset not found" });
    return;
  }
  res.json(dataset);
});

router.delete("/datasets/:id", async (req, res): Promise<void> => {
  const params = DeleteDatasetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dataset] = await db.delete(datasetsTable).where(eq(datasetsTable.id, params.data.id)).returning();
  if (!dataset) {
    res.status(404).json({ error: "Dataset not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
