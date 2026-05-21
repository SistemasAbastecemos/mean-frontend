import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserListComponent } from "./components/user-list.component";
import { AsistenciaComponent } from "./components/asistencia.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, UserListComponent, AsistenciaComponent],
  template: `
    <div class="nav">
      <button [class.active]="tab === 'usuarios'" (click)="tab='usuarios'">👥 Usuarios</button>
      <button [class.active]="tab === 'asistencia'" (click)="tab='asistencia'">📊 Asistencia</button>
    </div>
    <app-user-list *ngIf="tab === 'usuarios'"></app-user-list>
    <app-asistencia *ngIf="tab === 'asistencia'"></app-asistencia>
  `,
  styles: [`
    .nav { display:flex; gap:1rem; padding:1rem 1.5rem; background:#1e1b4b; }
    .nav button { background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.3); padding:0.5rem 1.2rem; border-radius:8px; cursor:pointer; font-size:0.95rem; }
    .nav button.active { background:#6366f1; border-color:#6366f1; }
  `]
})
export class AppComponent {
  tab = "asistencia";
}
