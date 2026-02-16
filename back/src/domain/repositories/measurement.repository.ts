// ──────────────────────────────────────────────
// Domain Repository — Measurement (Abstract)
// ──────────────────────────────────────────────

import {
  Measurement,
  CreateMeasurementDTO,
  UpdateMeasurementDTO,
} from "../entities/measurement.entity";

export interface MeasurementRepository {
  findAll(): Promise<Measurement[]>;
  findById(id: string): Promise<Measurement | null>;
  create(dto: CreateMeasurementDTO): Promise<Measurement>;
  update(id: string, dto: UpdateMeasurementDTO): Promise<Measurement | null>;
  delete(id: string): Promise<boolean>;
}
