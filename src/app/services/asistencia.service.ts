import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Asistencia {
  _id?: string;
  empleado: string;
  mes: string;
  diasAsistidos: number;
  totalDias: number;
  porcentaje?: string;
  clasificacion?: string;
  faltas?: number;
}

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private url = `${environment.apiUrl}/asistencia`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(this.url);
  }

  create(data: Asistencia): Observable<Asistencia> {
    return this.http.post<Asistencia>(this.url, data);
  }

  bulk(data: Asistencia[]): Observable<Asistencia[]> {
    return this.http.post<Asistencia[]>(`${this.url}/bulk`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }

  getResumen(): Observable<any> {
    return this.http.get(`${this.url}/resumen`);
  }
}
