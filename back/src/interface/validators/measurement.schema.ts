// ──────────────────────────────────────────────
// Interface — Zod Validation Schemas
// EPSG:4326 coordinate bounds enforced
// ──────────────────────────────────────────────

import { z } from "zod/v4";

// ── Longitude: -180 to 180 | Latitude: -90 to 90 ──

const longitudeSchema = z.number().min(-180).max(180);
const latitudeSchema = z.number().min(-90).max(90);

// A coordinate pair: [longitude, latitude] or [longitude, latitude, altitude]
const coordinatePairSchema = z
  .array(z.number())
  .min(2)
  .max(3)
  .refine((c) => c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90, {
    message: "Coordinates must be valid EPSG:4326 [longitude, latitude]",
  });

// GeoJSON geometry supporting Point, LineString, and Polygon
const geometrySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Point"),
    coordinates: z
      .array(z.number())
      .min(2)
      .max(3)
      .refine((c) => c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90, {
        message:
          "Point coordinates must be valid EPSG:4326 [longitude, latitude]",
      }),
  }),
  z.object({
    type: z.literal("LineString"),
    coordinates: z.array(coordinatePairSchema).min(2),
  }),
  z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(coordinatePairSchema).min(4)),
  }),
]);

const propertiesSchema = z.object({
  calculatedValue: z.number(),
  type: z.string().min(1),
  label: z.string().min(1),
});

// ── Create Schema ──
export const createMeasurementSchema = z.object({
  geometry: geometrySchema,
  properties: propertiesSchema,
});

// ── Update Schema (all fields optional) ──
export const updateMeasurementSchema = z.object({
  geometry: geometrySchema.optional(),
  properties: propertiesSchema.partial().optional(),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
