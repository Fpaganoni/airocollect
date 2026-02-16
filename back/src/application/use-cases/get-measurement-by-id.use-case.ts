// ──────────────────────────────────────────────
// Use Case — Get Measurement By ID
// ──────────────────────────────────────────────

import { Measurement } from "../../domain/entities/measurement.entity";
import { MeasurementRepository } from "../../domain/repositories/measurement.repository";

export class GetMeasurementById {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(id: string): Promise<Measurement | null> {
    return this.repository.findById(id);
  }
}
