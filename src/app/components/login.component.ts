import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-wrap">
  <div class="login-card">
    <div class="logo">
      <h1>Sistema de Asistencia</h1>
      <p>Abastecemos de Occidente S.A.S</p>
    </div>
    <div class="tabs">
      <button [class.active]="modo === 'login'" (click)="modo = 'login'">Ingresar</button>
      <button [class.active]="modo === 'registro'" (click)="modo = 'registro'">Registrarse</button>
    </div>
    <div class="alert error" *ngIf="error">{{ error }}</div>
    <div class="alert success" *ngIf="exito">{{ exito }}</div>
    <div class="form-group" *ngIf="modo === 'registro'">
      <label>Nombre</label>
      <input [(ngModel)]="form.nombre" placeholder="Nombre completo" />
    </div>
    <div class="form-group">
      <label>Email</label>
      <input [(ngModel)]="form.email" type="email" placeholder="correo@ejemplo.com" />
    </div>
    <div class="form-group">
      <label>Contrasena</label>
      <input [(ngModel)]="form.password" type="password" placeholder="••••••••" />
    </div>
    <div class="form-group" *ngIf="modo === 'registro'">
      <label>Rol</label>
      <select [(ngModel)]="form.rol">
        <option value="empleado">Empleado</option>
        <option value="admin">Administrador</option>
      </select>
    </div>
    <button class="btn-login" (click)="submit()" [disabled]="cargando">
      {{ cargando ? "Cargando..." : (modo === "login" ? "Ingresar" : "Registrarse") }}
    </button>
  </div>
</div>
  `,
  styles: [`
    .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f3f4f6}
    .login-card{background:#fff;border-radius:16px;padding:2rem;width:100%;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.1)}
    .logo{text-align:center;margin-bottom:1.5rem}
    .logo h1{margin:0;font-size:1.4rem;color:#1e1b4b}
    .logo p{margin:.3rem 0 0;font-size:.85rem;color:#888}
    .tabs{display:flex;gap:.5rem;margin-bottom:1.5rem}
    .tabs button{flex:1;padding:.6rem;border:1px solid #ddd;background:#f9f9f9;border-radius:8px;cursor:pointer;font-size:.95rem}
    .tabs button.active{background:#6366f1;color:#fff;border-color:#6366f1}
    .form-group{margin-bottom:1rem}
    label{display:block;font-size:.85rem;color:#555;margin-bottom:.3rem}
    input,select{width:100%;padding:.6rem .8rem;border:1px solid #ddd;border-radius:8px;font-size:.95rem;box-sizing:border-box}
    .btn-login{width:100%;padding:.75rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:.5rem}
    .btn-login:hover{background:#4f46e5}
    .btn-login:disabled{opacity:.6;cursor:not-allowed}
    .alert{padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem}
    .error{background:#fee2e2;color:#991b1b}
    .success{background:#dcfce7;color:#166534}
  `]
})
export class LoginComponent {
  modo = "login";
  form = { nombre: "", email: "", password: "", rol: "empleado" };
  error = "";
  exito = "";
  cargando = false;

  constructor(private auth: AuthService) {}

  submit() {
    this.error = "";
    this.exito = "";
    this.cargando = true;
    if (this.modo === "login") {
      this.auth.login(this.form.email, this.form.password).subscribe({
        next: (res) => {
          this.auth.guardarSesion(res.token, res.nombre, res.rol);
          window.location.href = "/";
        },
        error: (err) => {
          this.error = err.error?.error || "Error al ingresar";
          this.cargando = false;
        }
      });
    } else {
      this.auth.registro(this.form).subscribe({
        next: () => {
          this.exito = "Usuario registrado. Ahora puedes ingresar.";
          this.modo = "login";
          this.cargando = false;
        },
        error: (err) => {
          this.error = err.error?.error || "Error al registrarse";
          this.cargando = false;
        }
      });
    }
  }
}
