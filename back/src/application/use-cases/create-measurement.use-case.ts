// ──────────────────────────────────────────────
// Use Case — Create Measurement
// ──────────────────────────────────────────────

import {
  CreateMeasurementDTO,
  Measurement,
} from "../../domain/entities/measurement.entity";
import { MeasurementRepository } from "../../domain/repositories/measurement.repository";

export class CreateMeasurement {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(dto: CreateMeasurementDTO): Promise<Measurement> {
    return this.repository.create(dto);
  }
}
