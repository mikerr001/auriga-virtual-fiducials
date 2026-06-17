import { Router, type IRouter } from "express";
import healthRouter from "./health";
import calibrationRouter from "./calibration";
import datasetsRouter from "./datasets";
import estimationRouter from "./estimation";
import evaluationRouter from "./evaluation";
import researchDebtRouter from "./research_debt";
import validationRouter from "./validation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(calibrationRouter);
router.use(datasetsRouter);
router.use(estimationRouter);
router.use(evaluationRouter);
router.use(researchDebtRouter);
router.use(validationRouter);

export default router;
