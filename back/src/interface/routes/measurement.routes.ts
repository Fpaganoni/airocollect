// ──────────────────────────────────────────────
// Interface — Measurement Routes
// ──────────────────────────────────────────────

import { Router } from "express";
import { MeasurementController } from "../controllers/measurement.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  createMeasurementSchema,
  updateMeasurementSchema,
} from "../validators/measurement.schema";
import { MongoMeasurementRepository } from "../../infrastructure/repositories/measurement.repository.impl";

// ── Dependency Injection ──
const repository = new MongoMeasurementRepository();
const controller = new MeasurementController(repository);

const router: Router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createMeasurementSchema), controller.create);
router.put("/:id", validate(updateMeasurementSchema), controller.update);
router.delete("/:id", controller.delete);

export default router;
