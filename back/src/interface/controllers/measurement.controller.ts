// ──────────────────────────────────────────────
// Interface — Measurement Controller
// ──────────────────────────────────────────────

import { Request, Response } from "express";
import { CreateMeasurement } from "../../application/use-cases/create-measurement.use-case";
import { GetAllMeasurements } from "../../application/use-cases/get-all-measurements.use-case";
import { GetMeasurementById } from "../../application/use-cases/get-measurement-by-id.use-case";
import { UpdateMeasurement } from "../../application/use-cases/update-measurement.use-case";
import { DeleteMeasurement } from "../../application/use-cases/delete-measurement.use-case";
import { MeasurementRepository } from "../../domain/repositories/measurement.repository";

export class MeasurementController {
  private createUseCase: CreateMeasurement;
  private getAllUseCase: GetAllMeasurements;
  private getByIdUseCase: GetMeasurementById;
  private updateUseCase: UpdateMeasurement;
  private deleteUseCase: DeleteMeasurement;

  constructor(repository: MeasurementRepository) {
    this.createUseCase = new CreateMeasurement(repository);
    this.getAllUseCase = new GetAllMeasurements(repository);
    this.getByIdUseCase = new GetMeasurementById(repository);
    this.updateUseCase = new UpdateMeasurement(repository);
    this.deleteUseCase = new DeleteMeasurement(repository);
  }

  // GET /api/measurements
  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const measurements = await this.getAllUseCase.execute();
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  };

  // GET /api/measurements/:id
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const measurement = await this.getByIdUseCase.execute(
        req.params.id as string,
      );

      if (!measurement) {
        res.status(404).json({ error: "Measurement not found" });
        return;
      }

      res.json(measurement);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch measurement" });
    }
  };

  // POST /api/measurements
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const measurement = await this.createUseCase.execute(req.body);
      res.status(201).json(measurement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create measurement" });
    }
  };

  // PUT /api/measurements/:id
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const measurement = await this.updateUseCase.execute(
        req.params.id as string,
        req.body,
      );

      if (!measurement) {
        res.status(404).json({ error: "Measurement not found" });
        return;
      }

      res.json(measurement);
    } catch (error) {
      res.status(500).json({ error: "Failed to update measurement" });
    }
  };

  // DELETE /api/measurements/:id
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.deleteUseCase.execute(req.params.id as string);

      if (!deleted) {
        res.status(404).json({ error: "Measurement not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete measurement" });
    }
  };
}
