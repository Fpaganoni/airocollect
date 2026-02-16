import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './features/map/map.component';
import { ToolbarComponent } from './features/toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MapComponent, ToolbarComponent],
  template: `
    <div class="relative w-full h-full">
      <app-toolbar (modeChanged)="map.setDrawMode($event)"></app-toolbar>
      <app-map #map></app-map>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }
    `,
  ],
})
export class AppComponent {
  title = 'airocollect-front';

  @ViewChild('map') map!: MapComponent;
}
