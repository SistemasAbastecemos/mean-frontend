import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserListComponent } from "./components/user-list.component";
import { AsistenciaComponent } from "./components/asistencia.component";
import { LoginComponent } from "./components/login.component";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, UserListComponent, AsistenciaComponent, LoginComponent],
  template: `
    <ng-container *ngIf="!auth.isLoggedIn()">
      <app-login></app-login>
    </ng-container>
    <ng-container *ngIf="auth.isLoggedIn()">
      <div class="nav">
        <span class="nav-title">Hola, {{ auth.getNombre() }} ({{ auth.getRol() }})</span>
        <button [class.active]="tab === 'asistencia'" (click)="tab='asistencia'">Asistencia</button>
        <button *ngIf="auth.isAdmin()" [class.active]="tab === 'usuarios'" (click)="tab='usuarios'">Usuarios</button>
        <button class="btn-salir" (click)="auth.cerrarSesion()">Salir</button>
      </div>
      <app-user-list *ngIf="tab === 'usuarios' && auth.isAdmin()"></app-user-list>
      <app-asistencia *ngIf="tab === 'asistencia'"></app-asistencia>
    </ng-container>
  `,
  styles: [`
    .nav{display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;background:#1e1b4b}
    .nav-title{color:#fff;font-size:.9rem;opacity:.8;flex:1}
    .nav button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3);padding:.5rem 1.2rem;border-radius:8px;cursor:pointer;font-size:.95rem}
    .nav button.active{background:#6366f1;border-color:#6366f1}
    .btn-salir{background:#dc2626 !important;border-color:#dc2626 !important}
  `]
})
export class AppComponent implements OnInit {
  tab = "asistencia";
  constructor(public auth: AuthService) {}
  ngOnInit() {}
}
