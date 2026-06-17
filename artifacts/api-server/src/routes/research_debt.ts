import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, researchDebtTable } from "@workspace/db";
import {
  CreateResearchDebtBody,
  UpdateResearchDebtBody,
  GetResearchDebtParams,
  UpdateResearchDebtParams,
  DeleteResearchDebtParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/research-debt", async (_req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(researchDebtTable)
    .orderBy(desc(researchDebtTable.createdAt));
  res.json(entries);
});

router.post("/research-debt", async (req, res): Promise<void> => {
  const parsed = CreateResearchDebtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db
    .insert(researchDebtTable)
    .values({ ...parsed.data, status: "open" })
    .returning();
  res.status(201).json(entry);
});

router.get("/research-debt/:id", async (req, res): Promise<void> => {
  const params = GetResearchDebtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db
    .select()
    .from(researchDebtTable)
    .where(eq(researchDebtTable.id, params.data.id));
  if (!entry) {
    res.status(404).json({ error: "Research debt entry not found" });
    return;
  }
  res.json(entry);
});

router.patch("/research-debt/:id", async (req, res): Promise<void> => {
  const params = UpdateResearchDebtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateResearchDebtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db
    .update(researchDebtTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(researchDebtTable.id, params.data.id))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Research debt entry not found" });
    return;
  }
  res.json(entry);
});

router.delete("/research-debt/:id", async (req, res): Promise<void> => {
  const params = DeleteResearchDebtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db
    .delete(researchDebtTable)
    .where(eq(researchDebtTable.id, params.data.id))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Research debt entry not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
