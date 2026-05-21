import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { AsistenciaService, Asistencia } from "../services/asistencia.service";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-asistencia",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="container">
  <div class="header-card" *ngIf="pais">
    <img [src]="pais.flags.png" alt="bandera" class="bandera"/>
    <div>
      <h1>Sistema de Analisis de Asistencia Laboral</h1>
      <p>Pais: {{ pais.name.common }} | Region: {{ pais.region }} | Capital: {{ pais.capital?.[0] }}</p>
    </div>
  </div>

  <div class="tabs">
    <button *ngIf="auth.isAdmin()" [class.active]="seccion === 'registro'" (click)="seccion='registro'">Registrar</button>
    <button [class.active]="seccion === 'historico'" (click)="seccion='historico'">Historico por Empleado</button>
    <button *ngIf="auth.isAdmin()" [class.active]="seccion === 'resumen'" (click)="seccion='resumen'">Resumen General</button>
  </div>

  <ng-container *ngIf="seccion === 'registro' && auth.isAdmin()">
    <div class="card">
      <h2>Registrar Asistencia</h2>
      <div class="alert error" *ngIf="errorForm">{{ errorForm }}</div>
      <div class="form-grid">
        <input [(ngModel)]="form.empleado" placeholder="Nombre completo" />
        <input [(ngModel)]="form.identificacion" placeholder="Identificacion (CC/TI)" />
        <select [(ngModel)]="form.mes">
          <option value="">-- Selecciona mes --</option>
          <option *ngFor="let m of meses" [value]="m">{{ m }}</option>
        </select>
        <input [(ngModel)]="form.anio" type="number" placeholder="Ano (ej: 2026)" />
        <input [(ngModel)]="form.diasAsistidos" type="number" placeholder="Dias asistidos" min="0" max="31" />
        <input [(ngModel)]="form.totalDias" type="number" placeholder="Total dias laborales (max 31)" min="1" max="31" />
      </div>
      <button class="btn-primary" (click)="agregar()">+ Agregar</button>
    </div>
    <div class="card">
      <h2>Cargar CSV</h2>
      <p class="hint">Formato: empleado,identificacion,mes,anio,diasAsistidos,totalDias</p>
      <input type="file" accept=".csv" (change)="cargarCSV($event)" />
    </div>
  </ng-container>

  <ng-container *ngIf="seccion === 'historico'">
    <div class="card">
      <h2>Consulta Historica por Empleado</h2>
      <div class="form-grid">
        <input [(ngModel)]="filtro.identificacion" placeholder="Identificacion (CC/TI)" />
        <input [(ngModel)]="filtro.nombre" placeholder="Nombre empleado" />
        <select [(ngModel)]="filtro.anio">
          <option [value]="0">-- Todos los anos --</option>
          <option *ngFor="let a of anios" [value]="a">{{ a }}</option>
        </select>
      </div>
      <button class="btn-primary" (click)="buscarHistorico()">Buscar</button>
    </div>
    <div class="card" *ngIf="historico.length">
      <h2>Resultados: {{ historico.length }} registro(s)</h2>
      <table>
        <thead>
          <tr><th>Empleado</th><th>ID</th><th>Mes</th><th>Ano</th><th>Asistidos</th><th>Total</th><th>%</th><th>Clasificacion</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of historico">
            <td>{{ d.empleado }}</td>
            <td>{{ d.identificacion }}</td>
            <td>{{ d.mes }}</td>
            <td>{{ d.anio }}</td>
            <td>{{ d.diasAsistidos }}</td>
            <td>{{ d.totalDias }}</td>
            <td>{{ d.porcentaje }}%</td>
            <td><span class="badge" [ngClass]="getClase(d.clasificacion || '')">{{ d.clasificacion }}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="resumen-historico">
        <div class="stat excelente">Excelente: {{ contarH("Excelente") }}</div>
        <div class="stat regular">Regular: {{ contarH("Regular") }}</div>
        <div class="stat irregular">Irregular: {{ contarH("Irregular") }}</div>
        <div class="stat" style="background:#e0e7ff;color:#3730a3">Promedio: {{ promedioH() }}%</div>
      </div>
    </div>
    <div class="card" *ngIf="historico.length === 0 && busquedaRealizada">
      <p style="text-align:center;color:#888">No se encontraron registros.</p>
    </div>
  </ng-container>

  <ng-container *ngIf="seccion === 'resumen' && auth.isAdmin()">
    <div class="card resumen" *ngIf="resumen">
      <h2>Resumen General</h2>
      <p>Mes con mayor ausentismo: <strong>{{ resumen.mesMaxAusentismo }}</strong></p>
      <div class="stats">
        <div class="stat excelente">Excelente (90%+): {{ contarClasificacion("Excelente") }}</div>
        <div class="stat regular">Regular (75%+): {{ contarClasificacion("Regular") }}</div>
        <div class="stat irregular">Irregular (-75%): {{ contarClasificacion("Irregular") }}</div>
      </div>
    </div>
    <div class="card" *ngIf="datos.length">
      <h2>Asistencia vs Faltas</h2>
      <div class="bar-chart">
        <div class="bar-group" *ngFor="let d of datos">
          <div class="bar-label">{{ d.empleado }}<br/><small>{{ d.mes }}</small></div>
          <div class="bars">
            <div class="bar asistido" [style.height.px]="getAltura(d.diasAsistidos, d.totalDias)"></div>
            <div class="bar falta" [style.height.px]="getAltura(getFaltas(d), d.totalDias)"></div>
          </div>
          <div class="bar-pct">{{ d.porcentaje }}%</div>
        </div>
      </div>
      <div class="leyenda">
        <span class="leg-asistido">&#9632; Asistido</span>
        <span class="leg-falta">&#9632; Faltas</span>
      </div>
    </div>
    <div class="card" *ngIf="datos.length">
      <h2>Tendencia de Asistencia</h2>
      <div class="line-chart-wrap">
        <svg width="100%" [attr.viewBox]="getViewBox()">
          <polyline [attr.points]="getLinePoints()" fill="none" stroke="#6366f1" stroke-width="2.5"/>
          <circle *ngFor="let p of getPoints()" [attr.cx]="p.x" [attr.cy]="p.y" r="5" fill="#6366f1"/>
          <text *ngFor="let p of getPoints(); let i = index" [attr.x]="p.x" [attr.y]="p.y - 10" text-anchor="middle" font-size="11" fill="#6366f1">{{ datos[i].porcentaje }}%</text>
          <text *ngFor="let p of getPoints(); let i = index" [attr.x]="p.x" [attr.y]="150" text-anchor="middle" font-size="9" fill="#888">{{ getMes(i) }}</text>
        </svg>
      </div>
    </div>
    <div class="card" *ngIf="datos.length">
      <h2>Detalle de Registros</h2>
      <table>
        <thead>
          <tr><th>Empleado</th><th>ID</th><th>Mes</th><th>Ano</th><th>Asistidos</th><th>Total</th><th>%</th><th>Clasificacion</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of datos">
            <td>{{ d.empleado }}</td>
            <td>{{ d.identificacion }}</td>
            <td>{{ d.mes }}</td>
            <td>{{ d.anio }}</td>
            <td>{{ d.diasAsistidos }}</td>
            <td>{{ d.totalDias }}</td>
            <td>{{ d.porcentaje }}%</td>
            <td><span class="badge" [ngClass]="getClase(d.clasificacion || '')">{{ d.clasificacion }}</span></td>
            <td><button class="btn-delete" (click)="eliminar(d._id || '')">X</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    .container{max-width:960px;margin:0 auto;padding:1.5rem;font-family:sans-serif}
    .header-card{display:flex;align-items:center;gap:1rem;background:#1e1b4b;color:#fff;padding:1rem 1.5rem;border-radius:12px;margin-bottom:1.5rem}
    .bandera{width:60px;border-radius:4px}
    .header-card h1{margin:0;font-size:1.2rem}
    .header-card p{margin:.2rem 0 0;font-size:.85rem;opacity:.8}
    .tabs{display:flex;gap:.5rem;margin-bottom:1.5rem}
    .tabs button{flex:1;padding:.6rem;border:1px solid #ddd;background:#f9f9f9;border-radius:8px;cursor:pointer;font-size:.9rem}
    .tabs button.active{background:#6366f1;color:#fff;border-color:#6366f1}
    .card{background:#fff;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    h2{margin:0 0 1rem;font-size:1.1rem;color:#1e1b4b}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem}
    input:not([type=file]),select{width:100%;padding:.6rem .8rem;border:1px solid #ddd;border-radius:8px;font-size:.95rem;box-sizing:border-box}
    .btn-primary{background:#6366f1;color:#fff;border:none;padding:.6rem 1.5rem;border-radius:8px;cursor:pointer}
    .btn-delete{background:#fee2e2;color:#dc2626;border:none;padding:.3rem .6rem;border-radius:6px;cursor:pointer}
    .hint{font-size:.8rem;color:#888;margin-bottom:.5rem}
    .alert{padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem}
    .error{background:#fee2e2;color:#991b1b}
    .stats,.resumen-historico{display:flex;gap:1rem;flex-wrap:wrap;margin-top:.75rem}
    .stat{padding:.5rem 1rem;border-radius:8px;font-size:.9rem}
    .excelente{background:#dcfce7;color:#166534}
    .regular{background:#fef9c3;color:#854d0e}
    .irregular{background:#fee2e2;color:#991b1b}
    .bar-chart{display:flex;gap:1.5rem;align-items:flex-end;padding:1rem 0;min-height:160px;overflow-x:auto}
    .bar-group{display:flex;flex-direction:column;align-items:center;gap:4px}
    .bar-label{font-size:.75rem;text-align:center;color:#555;max-width:80px}
    .bars{display:flex;gap:4px;align-items:flex-end}
    .bar{width:28px;border-radius:4px 4px 0 0;min-height:4px}
    .asistido{background:#6366f1}
    .falta{background:#f87171}
    .bar-pct{font-size:.8rem;font-weight:600}
    .leyenda{display:flex;gap:1rem;margin-top:.5rem;font-size:.85rem}
    .leg-asistido{color:#6366f1}
    .leg-falta{color:#f87171}
    .line-chart-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:.9rem}
    th{background:#f1f5f9;padding:.6rem;text-align:left}
    td{padding:.6rem;border-bottom:1px solid #f1f5f9}
    .badge{padding:.2rem .6rem;border-radius:20px;font-size:.8rem;font-weight:600}
    .badge.excelente{background:#dcfce7;color:#166534}
    .badge.regular{background:#fef9c3;color:#854d0e}
    .badge.irregular{background:#fee2e2;color:#991b1b}
  `]
})
export class AsistenciaComponent implements OnInit {
  seccion = "historico";
  form: Asistencia = { empleado: "", identificacion: "", mes: "", anio: new Date().getFullYear(), diasAsistidos: 0, totalDias: 0 };
  filtro = { identificacion: "", nombre: "", anio: 0 };
  datos: Asistencia[] = [];
  historico: Asistencia[] = [];
  resumen: any = null;
  pais: any = null;
  errorForm = "";
  busquedaRealizada = false;

  meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  anios = [2023, 2024, 2025, 2026, 2027];

  constructor(private svc: AsistenciaService, private http: HttpClient, public auth: AuthService) {}

  ngOnInit() {
    if (this.auth.isAdmin()) this.seccion = "registro";
    this.cargarDatos();
    this.http.get<any[]>("https://restcountries.com/v3.1/alpha/co")
      .subscribe(r => this.pais = r[0]);
  }

  cargarDatos() {
    this.svc.getResumen().subscribe(r => {
      this.resumen = r;
      this.datos = r.datos || [];
    });
  }

  agregar() {
    this.errorForm = "";
    if (!this.form.empleado || !this.form.mes || !this.form.identificacion) {
      this.errorForm = "Completa todos los campos obligatorios.";
      return;
    }
    if (this.form.diasAsistidos < 0) {
      this.errorForm = "Los dias asistidos no pueden ser negativos.";
      return;
    }
    if (this.form.totalDias <= 0 || this.form.totalDias > 31) {
      this.errorForm = "El total de dias debe estar entre 1 y 31.";
      return;
    }
    if (this.form.diasAsistidos > this.form.totalDias) {
      this.errorForm = "Los dias asistidos no pueden superar el total de dias laborales.";
      return;
    }
    this.svc.create(this.form).subscribe(() => {
      this.form = { empleado: "", identificacion: "", mes: "", anio: new Date().getFullYear(), diasAsistidos: 0, totalDias: 0 };
      this.cargarDatos();
    });
  }

  buscarHistorico() {
    this.busquedaRealizada = true;
    this.svc.getHistorico({
      identificacion: this.filtro.identificacion,
      nombre: this.filtro.nombre,
      anio: this.filtro.anio || undefined
    }).subscribe(r => this.historico = r);
  }

  eliminar(id: string) {
    if (!id) return;
    this.svc.delete(id).subscribe(() => this.cargarDatos());
  }

  cargarCSV(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const lines = e.target.result.split("\n").filter((l: string) => l.trim());
      const registros: Asistencia[] = lines.slice(1).map((l: string) => {
        const [empleado, identificacion, mes, anio, diasAsistidos, totalDias] = l.split(",");
        return { empleado: empleado.trim(), identificacion: identificacion.trim(), mes: mes.trim(), anio: +anio, diasAsistidos: +diasAsistidos, totalDias: +totalDias };
      });
      this.svc.bulk(registros).subscribe(() => this.cargarDatos());
    };
    reader.readAsText(file);
  }

  contarClasificacion(c: string) { return this.datos.filter(d => d.clasificacion === c).length; }
  contarH(c: string) { return this.historico.filter(d => d.clasificacion === c).length; }
  promedioH(): string {
    if (!this.historico.length) return "0";
    const sum = this.historico.reduce((a, b) => a + +(b.porcentaje || 0), 0);
    return (sum / this.historico.length).toFixed(2);
  }

  getFaltas(d: Asistencia): number {
    return (d.faltas !== undefined) ? d.faltas : d.totalDias - d.diasAsistidos;
  }

  getAltura(valor: number, total: number): number {
    return total > 0 ? (valor / total) * 120 : 0;
  }

  getClase(c: string) {
    if (c === "Excelente") return "excelente";
    if (c === "Regular") return "regular";
    return "irregular";
  }

  getMes(i: number): string { return this.datos[i]?.mes?.substring(0, 3) || ""; }
  getViewBox(): string { return "0 0 " + (this.datos.length * 100 + 60) + " 160"; }

  getPoints() {
    return this.datos.map((d, i) => ({
      x: 50 + i * 100,
      y: 130 - (+(d.porcentaje || "0") / 100) * 110
    }));
  }

  getLinePoints() { return this.getPoints().map(p => `${p.x},${p.y}`).join(" "); }
}
