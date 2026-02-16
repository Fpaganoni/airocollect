// ──────────────────────────────────────────────
// Use Case — Get All Measurements
// ──────────────────────────────────────────────

import { Measurement } from "../../domain/entities/measurement.entity";
import { MeasurementRepository } from "../../domain/repositories/measurement.repository";

export class GetAllMeasurements {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(): Promise<Measurement[]> {
    return this.repository.findAll();
  }
}
