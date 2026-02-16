// ──────────────────────────────────────────────
// Use Case — Update Measurement
// ──────────────────────────────────────────────

import {
  UpdateMeasurementDTO,
  Measurement,
} from "../../domain/entities/measurement.entity";
import { MeasurementRepository } from "../../domain/repositories/measurement.repository";

export class UpdateMeasurement {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(
    id: string,
    dto: UpdateMeasurementDTO,
  ): Promise<Measurement | null> {
    return this.repository.update(id, dto);
  }
}
