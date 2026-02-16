// ──────────────────────────────────────────────
// Use Case — Delete Measurement
// ──────────────────────────────────────────────

import { MeasurementRepository } from "../../domain/repositories/measurement.repository";

export class DeleteMeasurement {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
