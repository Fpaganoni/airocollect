// ──────────────────────────────────────────────
// Domain Entity — Measurement
// ──────────────────────────────────────────────

export type GeoJSONType = "Point" | "LineString" | "Polygon";

export interface GeoJSONGeometry {
  type: GeoJSONType;
  coordinates: number[] | number[][] | number[][][];
}

export interface MeasurementProperties {
  calculatedValue: number;
  type: string;
  label: string;
}

export interface Measurement {
  _id: string;
  geometry: GeoJSONGeometry;
  properties: MeasurementProperties;
}

export interface CreateMeasurementDTO {
  geometry: GeoJSONGeometry;
  properties: MeasurementProperties;
}

export interface UpdateMeasurementDTO {
  geometry?: GeoJSONGeometry;
  properties?: Partial<MeasurementProperties>;
}
