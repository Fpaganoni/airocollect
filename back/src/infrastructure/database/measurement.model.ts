// ──────────────────────────────────────────────
// Infrastructure — Mongoose Model for Measurement
// GeoJSON with 2dsphere index (EPSG:4326)
// ──────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";
import { GeoJSONType } from "../../domain/entities/measurement.entity";

export interface MeasurementDocument extends Document {
  geometry: {
    type: GeoJSONType;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    calculatedValue: number;
    type: string;
    label: string;
  };
}

// Shape of the raw MongoDB object — used in toJSON.transform and the repository
export interface MeasurementRawDocument {
  _id: Types.ObjectId | string;
  geometry: MeasurementDocument["geometry"];
  properties: MeasurementDocument["properties"];
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const MeasurementSchema = new Schema<MeasurementDocument>(
  {
    geometry: {
      type: {
        type: String,
        enum: ["Point", "LineString", "Polygon"],
        required: true,
      },
      coordinates: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    properties: {
      calculatedValue: { type: Number, required: true },
      type: { type: String, required: true },
      label: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Transform the output to match the Measurement interface
      transform(_doc, ret: MeasurementRawDocument) {
        ret._id = ret._id.toString();
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

// 2dsphere index for geospatial queries
MeasurementSchema.index({ geometry: "2dsphere" });

export const MeasurementModel = mongoose.model<MeasurementDocument>(
  "Measurement",
  MeasurementSchema,
);
