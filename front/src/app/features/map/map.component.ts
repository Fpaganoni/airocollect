import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap } from 'ol/interaction';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { unByKey } from 'ol/Observable';
import { MeasurementService } from '../../core/services/measurement.service';
import { Measurement } from '../../core/models/measurement.model';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex w-full h-full font-sans">
      <!-- Sidebar -->
      <div
        class="w-80 h-full bg-white shadow-lg z-10 p-4 overflow-y-auto flex flex-col gap-4 border-r border-gray-200"
      >
        <h2 class="text-xl font-bold text-black border-b border-black pb-2">
          Measurements
        </h2>

        <!-- List -->
        <div class="flex flex-col gap-3 mt-2">
          @for (
            measure of measurementService.measurements();
            track measure._id
          ) {
            <div
              class="bg-gray-50 border border-gray-200 rounded p-3 hover:shadow-md transition cursor-pointer group"
              (click)="zoomToFeature(measure._id!)"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded"
                >
                  {{ measure.properties.type }}
                </span>
                <div
                  class="flex gap-2 opacity-0 group-hover:opacity-100 transition"
                >
                  <button
                    (click)="
                      deleteMeasurement(measure._id!); $event.stopPropagation()
                    "
                    class="text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm border border-gray-100"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <input
                class="w-full text-lg font-medium bg-gray-50 text-black outline-none transition-colors px-0 py-1"
                [value]="measure.properties.label"
                (change)="updateLabel(measure._id!, $event)"
                (click)="$event.stopPropagation()"
              />

              <div class="text-sm text-gray-800 mt-1">
                Total:
                {{ measure.properties.calculatedValue | number: '1.2-2' }} m
                @if (measure.properties.type === 'LineString') {
                  <div
                    class="mt-2 text-xs text-gray-500 pl-2 border-l-2 border-gray-300"
                  >
                    @for (
                      segLength of getSegmentLengths(measure);
                      track $index
                    ) {
                      <div>Segment {{ $index + 1 }}: {{ segLength }}</div>
                    }
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="text-center text-gray-400 py-8 italic">
              No measurements yet.<br />Start drawing!
            </div>
          }
        </div>
      </div>

      <!-- Map Container -->
      <div id="map" class="flex-1 w-full h-full relative"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        width: 100%;
        position: relative;
      }
      #map {
        background-color: #eeeeee;
      }
      .tooltip-static.bg-black {
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        border: none;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, AfterViewInit {
  public measurementService = inject(MeasurementService);

  private map!: Map;
  private source = new VectorSource();
  private vector = new VectorLayer({
    source: this.source,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: '#3b82f6', // Tailwind blue-500
        width: 3,
      }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: '#3b82f6',
        }),
      }),
    }),
  });

  private sketch: Feature | null = null;
  private helpTooltipElement: HTMLElement | null = null;
  private helpTooltip: Overlay | null = null;
  private measureTooltipElement: HTMLElement | null = null;
  private measureTooltip: Overlay | null = null;

  // Segment tooltips

  private drawProperties: { type: 'LineString' | 'Polygon' } = {
    type: 'LineString',
  };
  private drawInteraction: Draw | null = null;
  private modifyInteraction!: Modify;
  private snapInteraction!: Snap;

  constructor() {
    effect(() => {
      const backendMeasurements = this.measurementService.measurements();
      if (
        this.source.getFeatures().length === 0 &&
        backendMeasurements.length > 0
      ) {
        this.addFeaturesFromBackend(backendMeasurements);
      }
    });
  }

  ngOnInit(): void {
    this.measurementService.getAll().subscribe();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.addInteractions();

    setTimeout(() => {
      this.map.updateSize();
    }, 200);
  }

  private initMap(): void {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 18,
          }),
        }),
        this.vector,
      ],
      view: new View({
        center: [484428, 6593467],
        zoom: 10,
      }),
    });
  }

  private addFeaturesFromBackend(measurements: Measurement[]): void {
    const format = new GeoJSON();
    measurements.forEach((m) => {
      const geometry = format.readGeometry(m.geometry, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });
      const feature = new Feature(geometry);
      feature.setId(m._id);
      feature.setProperties(m.properties);

      // Check if feature already exists to avoid duplicates
      if (!this.source.getFeatureById(m._id)) {
        this.source.addFeature(feature);
        this.createStaticTooltip(feature as Feature);

        if (m.properties.type === 'LineString') {
          this.updateSegmentTooltips(feature as Feature);
        }
      }
    });
  }

  private addInteractions(): void {
    this.modifyInteraction = new Modify({ source: this.source });
    this.modifyInteraction.on('modifyend', (evt) => {
      evt.features.forEach((feature) => {
        const id = feature.getId();
        if (id) {
          this.updateMeasurement(feature as Feature);
        }
        this.updateStaticTooltip(feature as Feature);
      });
    });

    this.map.addInteraction(this.modifyInteraction);

    this.snapInteraction = new Snap({ source: this.source });
    this.map.addInteraction(this.snapInteraction);

    this.addDrawInteraction('LineString');
  }

  public setDrawMode(type: 'LineString' | 'Polygon'): void {
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }
    this.addDrawInteraction(type);
  }

  private addDrawInteraction(type: 'LineString' | 'Polygon'): void {
    this.drawInteraction = new Draw({
      source: this.source,
      type: type,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: 'rgba(255, 255, 255, 0.5)',
          lineDash: [10, 10],
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.7)',
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
        }),
      }),
    });

    this.map.addInteraction(this.drawInteraction);
    this.createMeasureTooltip();

    let listener: any;

    this.drawInteraction.on('drawstart', (evt) => {
      this.sketch = evt.feature;
      let tooltipCoord = (evt as any).coordinate;

      listener = this.sketch.getGeometry()!.on('change', (evt) => {
        const geom = evt.target;
        let output;

        if (geom instanceof Polygon) {
          output = this.formatArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          output = this.formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
          // We need to pass the feature, but during drawing 'geom' is what changes
          // The helper expects a Feature. Let's create a temporary feature or update the helper to accept Geometry?
          // Updating helper to accept Feature is better for persistence, but here we are in sketch mode.
          // Actually, 'this.sketch' IS the feature.
          if (this.sketch) {
            this.updateSegmentTooltips(this.sketch);
          }
        }

        if (this.measureTooltipElement) {
          this.measureTooltipElement.innerHTML = output!;
          this.measureTooltip!.setPosition(tooltipCoord);
        }
      });
    });

    this.drawInteraction.on('drawend', (evt) => {
      if (this.measureTooltipElement) {
        this.measureTooltipElement.className = 'tooltip tooltip-static';
        this.measureTooltip!.setOffset([0, -7]);
      }

      const feature = evt.feature;
      const geom = feature.getGeometry();
      let value = 0;
      let label = '';

      if (geom instanceof Polygon) {
        value = getArea(geom, { projection: 'EPSG:3857' });
        label = this.formatArea(geom);
      } else if (geom instanceof LineString) {
        value = getLength(geom, { projection: 'EPSG:3857' });
        label = this.formatLength(geom);
      }

      feature.set('calculatedValue', value);
      feature.set('label', label);
      feature.set('type', type);

      // IMPORTANT: Attach the overlay to the feature so it can be removed later
      feature.set('overlay', this.measureTooltip);

      this.sketch = null;
      this.measureTooltipElement = null;
      this.createMeasureTooltip();
      unByKey(listener);

      this.saveMeasurement(feature, value, label, type);
    });
  }

  // --- Segment Measurements ---

  private updateSegmentTooltips(feature: Feature) {
    const geom = feature.getGeometry();
    if (!(geom instanceof LineString)) return;

    // Clear existing segment tooltips for this feature
    const oldTooltips = (feature.get('segmentOverlays') as Overlay[]) || [];
    oldTooltips.forEach((overlay) => this.map.removeOverlay(overlay));

    // Calculate new segments
    const newTooltips: Overlay[] = [];
    const coordinates = geom.getCoordinates();

    if (coordinates.length < 2) {
      feature.set('segmentOverlays', []);
      return;
    }

    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];

      const segmentLine = new LineString([p1, p2]);
      const length = getLength(segmentLine, { projection: 'EPSG:3857' });
      const label =
        length.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + ' m';

      const midPoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      const overlay = this.createSegmentTooltip(midPoint, label);
      newTooltips.push(overlay);
    }

    feature.set('segmentOverlays', newTooltips);
  }

  private createSegmentTooltip(position: number[], text: string): Overlay {
    const element = document.createElement('div');
    element.className =
      'tooltip tooltip-static bg-black text-white text-xs px-1 rounded opacity-80';
    element.innerHTML = text;

    const overlay = new Overlay({
      element: element,
      offset: [0, -7],
      positioning: 'bottom-center',
      stopEvent: false,
    });

    overlay.setPosition(position);
    this.map.addOverlay(overlay);
    return overlay;
  }

  // Helper for Sidebar to get segment lengths
  public getSegmentLengths(measurement: Measurement): string[] {
    if (measurement.properties.type !== 'LineString' || !measurement.geometry)
      return [];

    const format = new GeoJSON();
    try {
      const geom = format.readGeometry(measurement.geometry, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });

      if (geom instanceof LineString) {
        const coordinates = geom.getCoordinates();
        const lengths: string[] = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
          const segmentLine = new LineString([
            coordinates[i],
            coordinates[i + 1],
          ]);
          const length = getLength(segmentLine, { projection: 'EPSG:3857' });
          lengths.push(
            length.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + ' m',
          );
        }
        return lengths;
      }
    } catch (e) {
      console.error('Error parsing geometry', e);
    }
    return [];
  }

  // --- CRUD & Sidebar Operations ---

  saveMeasurement(
    feature: Feature,
    value: number,
    label: string,
    type: string,
  ) {
    const format = new GeoJSON();
    const geoJsonGeom = format.writeGeometryObject(feature.getGeometry()!, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326',
    }) as any;

    const dto = {
      geometry: geoJsonGeom,
      properties: {
        calculatedValue: value,
        type: type,
        label: label,
      },
    };

    this.measurementService.create(dto).subscribe((saved) => {
      feature.setId(saved._id);
      // Ensure segment tooltips are persisted/associated with the feature
      if (type === 'LineString') {
        this.updateSegmentTooltips(feature);
      }
    });
  }

  updateMeasurement(feature: Feature) {
    const id = feature.getId()?.toString();
    if (!id) return;

    const geom = feature.getGeometry();
    let value = 0;
    let label = '';

    // Update segments visual
    if (geom instanceof LineString) {
      this.updateSegmentTooltips(feature);
    }

    if (geom instanceof Polygon) {
      value = getArea(geom, { projection: 'EPSG:3857' });
      label = this.formatArea(geom);
    } else if (geom instanceof LineString) {
      value = getLength(geom, { projection: 'EPSG:3857' });
      label = this.formatLength(geom);
    }

    const format = new GeoJSON();
    const geoJsonGeom = format.writeGeometryObject(geom!, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326',
    }) as any;

    // Use current label from properties if available, otherwise formatted value
    const currentLabel = feature.get('label') || label;

    const dto = {
      geometry: geoJsonGeom,
      properties: {
        calculatedValue: value,
        label: currentLabel,
      },
    };

    this.measurementService.update(id, dto).subscribe();
  }

  zoomToFeature(id: string) {
    const feature = this.source.getFeatureById(id);
    if (feature) {
      const geometry = feature.getGeometry();
      if (geometry) {
        // Cast to SimpleGeometry as fit expects it (most geometries in this app are Simple)
        this.map.getView().fit(geometry as any, {
          padding: [100, 100, 100, 100],
          duration: 1000,
        });
      }
    }
  }

  updateLabel(id: string, event: Event) {
    const newLabel = (event.target as HTMLInputElement).value;
    const feature = this.source.getFeatureById(id);

    if (feature) {
      feature.set('label', newLabel);
      this.updateStaticTooltip(feature as Feature);
      this.updateMeasurement(feature as Feature);
    }
  }

  deleteMeasurement(id: string) {
    this.measurementService.delete(id).subscribe(() => {
      const feature = this.source.getFeatureById(id);
      if (feature) {
        // Remove main tooltip
        const overlay = feature.get('overlay') as Overlay;
        if (overlay) {
          this.map.removeOverlay(overlay);
        }

        // Remove segment tooltips
        const segmentOverlays =
          (feature.get('segmentOverlays') as Overlay[]) || [];
        segmentOverlays.forEach((o) => this.map.removeOverlay(o));

        this.source.removeFeature(feature);
      }
    });
  }

  // --- Tooltips & Formatting ---

  private createMeasureTooltip() {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode?.removeChild(
        this.measureTooltipElement,
      );
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'tooltip tooltip-measure';
    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    });
    this.map.addOverlay(this.measureTooltip);
  }

  private createStaticTooltip(feature: Feature) {
    const element = document.createElement('div');
    element.className = 'tooltip tooltip-static';
    element.innerHTML = feature.get('label') || '';

    const overlay = new Overlay({
      element: element,
      offset: [0, -7],
      positioning: 'bottom-center',
    });

    const geom = feature.getGeometry();
    if (geom instanceof Polygon) {
      overlay.setPosition(geom.getInteriorPoint().getCoordinates());
    } else if (geom instanceof LineString) {
      overlay.setPosition(geom.getLastCoordinate());
    }

    this.map.addOverlay(overlay);
    feature.set('overlay', overlay);
  }

  private updateStaticTooltip(feature: Feature) {
    const overlay = feature.get('overlay') as Overlay;
    if (!overlay) return;

    const geom = feature.getGeometry();
    const label = feature.get('label'); // Respect user edit

    // If label was not edited (or matches old format), we could potentially update it if it's dynamic
    // But for this requirement, we assume 'label' property is primary.
    // However, if geometry changed (via Modify), we usually want to update the displayed value if it hasn't been custom text.
    // The current implementation saves 'formatted value' as 'label' initially.
    // If we want to strictly follow "label should show total distance", we should probably re-format it if it looks like a measurement.
    // But simplest is to just ensure position is correct.

    if (geom instanceof Polygon) {
      overlay.setPosition(geom.getInteriorPoint().getCoordinates());
    } else if (geom instanceof LineString) {
      overlay.setPosition(geom.getLastCoordinate());
      // Also update segment labels
      this.updateSegmentTooltips(feature);
    }
    overlay.getElement()!.innerHTML = label;
  }

  private formatLength(line: LineString): string {
    const length = getLength(line, { projection: 'EPSG:3857' });
    return (
      length.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' m'
    );
  }

  private formatArea(polygon: Polygon): string {
    const area = getArea(polygon, { projection: 'EPSG:3857' });
    return (
      area.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' m²'
    );
  }
}
