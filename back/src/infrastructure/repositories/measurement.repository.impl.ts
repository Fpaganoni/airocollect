// ──────────────────────────────────────────────
// Infrastructure — Measurement Repository (Mongoose)
// ──────────────────────────────────────────────

import {
  Measurement,
  CreateMeasurementDTO,
  UpdateMeasurementDTO,
} from "../../domain/entities/measurement.entity";
import { MeasurementRepository } from "../../domain/repositories/measurement.repository";
import {
  MeasurementModel,
  MeasurementRawDocument,
} from "../database/measurement.model";

export class MongoMeasurementRepository implements MeasurementRepository {
  async findAll(): Promise<Measurement[]> {
    const docs = await MeasurementModel.find().lean();
    return docs.map(this.toEntity);
  }

  async findById(id: string): Promise<Measurement | null> {
    const doc = await MeasurementModel.findById(id).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async create(dto: CreateMeasurementDTO): Promise<Measurement> {
    const doc = await MeasurementModel.create(dto);
    return this.toEntity(doc.toObject());
  }

  async update(
    id: string,
    dto: UpdateMeasurementDTO,
  ): Promise<Measurement | null> {
    // Build a flat update object so partial properties are merged correctly
    const updateFields: Record<string, unknown> = {};

    if (dto.geometry) {
      updateFields.geometry = dto.geometry;
    }

    if (dto.properties) {
      for (const [key, value] of Object.entries(dto.properties)) {
        if (value !== undefined) {
          updateFields[`properties.${key}`] = value;
        }
      }
    }

    const doc = await MeasurementModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).lean();

    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await MeasurementModel.findByIdAndDelete(id);
    return result !== null;
  }

  // ── Map Mongoose lean doc → Domain entity ──
  private toEntity(doc: MeasurementRawDocument): Measurement {
    return {
      _id: doc._id.toString(),
      geometry: doc.geometry,
      properties: {
        calculatedValue: doc.properties.calculatedValue,
        type: doc.properties.type,
        label: doc.properties.label,
      },
    };
  }
}
