import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Measurement,
  CreateMeasurementDTO,
  UpdateMeasurementDTO,
} from '../models/measurement.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MeasurementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/measurements';

  // Signals to hold state
  measurements = signal<Measurement[]>([]);

  getAll(): Observable<Measurement[]> {
    return this.http
      .get<Measurement[]>(this.apiUrl)
      .pipe(tap((data) => this.measurements.set(data)));
  }

  create(dto: CreateMeasurementDTO): Observable<Measurement> {
    return this.http.post<Measurement>(this.apiUrl, dto).pipe(
      tap((newMeasurement) => {
        this.measurements.update((current) => [...current, newMeasurement]);
      }),
    );
  }

  update(id: string, dto: UpdateMeasurementDTO): Observable<Measurement> {
    return this.http.put<Measurement>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((updatedMeasurement) => {
        this.measurements.update((current) =>
          current.map((m) => (m._id === id ? updatedMeasurement : m)),
        );
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.measurements.update((current) =>
          current.filter((m) => m._id !== id),
        );
      }),
    );
  }
}
