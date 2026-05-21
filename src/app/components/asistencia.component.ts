import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { AsistenciaService, Asistencia } from "../services/asistencia.service";

@Component({
  selector: "app-asistencia",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="container">
  <div class="header-card" *ngIf="pais">
    <img [src]="pais.flags.png" alt="bandera" class="bandera"/>
    <div>
      <h1>Sistema de Análisis de Asistencia Laboral</h1>
      <p>País: {{ pais.name.common }} | Región: {{ pais.region }} | Capital: {{ pais.capital?.[0] }}</p>
    </div>
  </div>
  <div class="card">
    <h2>Registrar Asistencia</h2>
    <div class="form-grid">
      <input [(ngModel)]="form.empleado" placeholder="Nombre empleado" />
      <input [(ngModel)]="form.mes" placeholder="Mes (ej: Enero 2025)" />
      <input [(ngModel)]="form.diasAsistidos" type="number" placeholder="Días asistidos" />
      <input [(ngModel)]="form.totalDias" type="number" placeholder="Total días laborales" />
    </div>
    <button class="btn-primary" (click)="agregar()">+ Agregar</button>
  </div>
  <div class="card">
    <h2>Cargar CSV</h2>
    <p class="hint">Formato: empleado,mes,diasAsistidos,totalDias</p>
    <input type="file" accept=".csv" (change)="cargarCSV($event)" />
  </div>
  <div class="card resumen" *ngIf="resumen">
    <h2>Resumen</h2>
    <p>Mes con mayor ausentismo: <strong>{{ resumen.mesMaxAusentismo }}</strong></p>
    <div class="stats">
      <div class="stat excelente">Excelente (>=90%): {{ contarClasificacion("Excelente") }}</div>
      <div class="stat regular">Regular (>=75%): {{ contarClasificacion("Regular") }}</div>
      <div class="stat irregular">Irregular (<75%): {{ contarClasificacion("Irregular") }}</div>
    </div>
  </div>
  <div class="card" *ngIf="datos.length">
    <h2>Asistencia vs Faltas</h2>
    <div class="chart-container">
      <div class="bar-chart">
        <div class="bar-group" *ngFor="let d of datos">
          <div class="bar-label">{{ d.empleado }}</div>
          <div class="bars">
            <div class="bar asistido" [style.height.px]="(d.diasAsistidos / d.totalDias) * 120"></div>
            <div class="bar falta" [style.height.px]="(d.faltas / d.totalDias) * 120"></div>
          </div>
          <div class="bar-pct">{{ d.porcentaje }}%</div>
        </div>
      </div>
      <div class="leyenda">
        <span class="leg-asistido">Asistido</span>
        <span class="leg-falta">Faltas</span>
      </div>
    </div>
  </div>
  <div class="card" *ngIf="datos.length">
    <h2>Tendencia de Asistencia</h2>
    <div class="line-chart-wrap">
      <svg width="100%" [attr.viewBox]="'0 0 ' + (datos.length * 100 + 60) + ' 160'">
        <polyline [attr.points]="getLinePoints()" fill="none" stroke="#6366f1" stroke-width="2.5"/>
        <circle *ngFor="let p of getPoints()" [attr.cx]="p.x" [attr.cy]="p.y" r="5" fill="#6366f1"/>
        <text *ngFor="let p of getPoints(); let i = index" [attr.x]="p.x" [attr.y]="p.y - 10" text-anchor="middle" font-size="11" fill="#6366f1">{{ datos[i].porcentaje }}%</text>
        <text *ngFor="let p of getPoints(); let i = index" [attr.x]="p.x" [attr.y]="150" text-anchor="middle" font-size="9" fill="#888">{{ datos[i].mes.substring(0,3) }}</text>
      </svg>
    </div>
  </div>
  <div class="card" *ngIf="datos.length">
    <h2>Detalle de Registros</h2>
    <table>
      <thead>
        <tr><th>Empleado</th><th>Mes</th><th>Asistidos</th><th>Total</th><th>%</th><th>Clasificacion</th><th></th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let d of datos">
          <td>{{ d.empleado }}</td>
          <td>{{ d.mes }}</td>
          <td>{{ d.diasAsistidos }}</td>
          <td>{{ d.totalDias }}</td>
          <td>{{ d.porcentaje }}%</td>
          <td><span class="badge" [class]="getClase(d.clasificacion)">{{ d.clasificacion }}</span></td>
          <td><button class="btn-delete" (click)="eliminar(d._id)">X</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .container{max-width:960px;margin:0 auto;padding:1.5rem;font-family:sans-serif}
    .header-card{display:flex;align-items:center;gap:1rem;background:#1e1b4b;color:#fff;padding:1rem 1.5rem;border-radius:12px;margin-bottom:1.5rem}
    .bandera{width:60px;border-radius:4px}
    .header-card h1{margin:0;font-size:1.2rem}
    .header-card p{margin:.2rem 0 0;font-size:.85rem;opacity:.8}
    .card{background:#fff;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    h2{margin:0 0 1rem;font-size:1.1rem;color:#1e1b4b}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem}
    input:not([type=file]){width:100%;padding:.6rem .8rem;border:1px solid #ddd;border-radius:8px;font-size:.95rem;box-sizing:border-box}
    .btn-primary{background:#6366f1;color:#fff;border:none;padding:.6rem 1.5rem;border-radius:8px;cursor:pointer}
    .btn-delete{background:#fee2e2;color:#dc2626;border:none;padding:.3rem .6rem;border-radius:6px;cursor:pointer}
    .hint{font-size:.8rem;color:#888;margin-bottom:.5rem}
    .stats{display:flex;gap:1rem;flex-wrap:wrap;margin-top:.75rem}
    .stat{padding:.5rem 1rem;border-radius:8px;font-size:.9rem}
    .excelente{background:#dcfce7;color:#166534}
    .regular{background:#fef9c3;color:#854d0e}
    .irregular{background:#fee2e2;color:#991b1b}
    .bar-chart{display:flex;gap:1.5rem;align-items:flex-end;padding:1rem 0;min-height:160px}
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
  form: Asistencia = { empleado: "", mes: "", diasAsistidos: 0, totalDias: 0 };
  datos: Asistencia[] = [];
  resumen: any = null;
  pais: any = null;

  constructor(private svc: AsistenciaService, private http: HttpClient) {}

  ngOnInit() {
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
    if (!this.form.empleado || !this.form.mes) return;
    this.svc.create(this.form).subscribe(() => {
      this.form = { empleado: "", mes: "", diasAsistidos: 0, totalDias: 0 };
      this.cargarDatos();
    });
  }

  eliminar(id: string) {
    this.svc.delete(id).subscribe(() => this.cargarDatos());
  }

  cargarCSV(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const lines = e.target.result.split("\n").filter((l: string) => l.trim());
      const registros: Asistencia[] = lines.slice(1).map((l: string) => {
        const [empleado, mes, diasAsistidos, totalDias] = l.split(",");
        return { empleado: empleado.trim(), mes: mes.trim(), diasAsistidos: +diasAsistidos, totalDias: +totalDias };
      });
      this.svc.bulk(registros).subscribe(() => this.cargarDatos());
    };
    reader.readAsText(file);
  }

  contarClasificacion(c: string) {
    return this.datos.filter(d => d.clasificacion === c).length;
  }

  getClase(c: string) {
    if (c === "Excelente") return "excelente";
    if (c === "Regular") return "regular";
    return "irregular";
  }

  getPoints() {
    return this.datos.map((d, i) => ({
      x: 50 + i * 100,
      y: 130 - (+d.porcentaje! / 100) * 110
    }));
  }

  getLinePoints() {
    return this.getPoints().map(p => `${p.x},${p.y}`).join(" ");
  }
}
