import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex gap-2 z-10"
    >
      <button
        (click)="setMode('LineString')"
        [class.bg-blue-100]="activeMode === 'LineString'"
        class="px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors text-gray-700 flex items-center gap-2 shadow-lg"
      >
        <span>Line</span>
      </button>
      <button
        (click)="setMode('Polygon')"
        [class.bg-blue-100]="activeMode === 'Polygon'"
        class="px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors text-gray-700 flex items-center gap-2"
      >
        <span>Polygon</span>
      </button>
    </div>
  `,
})
export class ToolbarComponent {
  @Output() modeChanged = new EventEmitter<'LineString' | 'Polygon'>();

  activeMode: 'LineString' | 'Polygon' = 'LineString';

  setMode(mode: 'LineString' | 'Polygon') {
    this.activeMode = mode;
    this.modeChanged.emit(mode);
  }
}
