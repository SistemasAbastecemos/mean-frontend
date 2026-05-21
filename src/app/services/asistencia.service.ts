import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Asistencia {
  _id?: string;
  empleado: string;
  identificacion: string;
  mes: string;
  anio: number;
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

  getHistorico(filtros: { identificacion?: string; nombre?: string; anio?: number }): Observable<Asistencia[]> {
    let params = new HttpParams();
    if (filtros.identificacion) params = params.set('identificacion', filtros.identificacion);
    if (filtros.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros.anio) params = params.set('anio', filtros.anio.toString());
    return this.http.get<Asistencia[]>(`${this.url}/historico`, { params });
  }
}
