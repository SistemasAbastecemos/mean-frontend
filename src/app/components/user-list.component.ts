// src/app/components/user-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserService, User } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="container">

      <!-- ── Header ─────────────────────────────────── -->
      <header class="header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p class="subtitle">Stack MEAN · MongoDB Atlas + Railway</p>
        </div>
        <span class="badge">{{ users().length }} usuario{{ users().length !== 1 ? 's' : '' }}</span>
      </header>

      <!-- ── Alerta de errores ───────────────────────── -->
      @if (errorMsg()) {
        <div class="alert alert-error" role="alert">
          <span>⚠️ {{ errorMsg() }}</span>
          <button class="btn-close" (click)="errorMsg.set('')">✕</button>
        </div>
      }
      @if (successMsg()) {
        <div class="alert alert-success" role="alert">
          <span>✅ {{ successMsg() }}</span>
        </div>
      }

      <!-- ── Formulario ──────────────────────────────── -->
      <section class="card form-card">
        <h2 class="card-title">{{ editId ? 'Editar usuario' : 'Nuevo usuario' }}</h2>

        <div class="form-row">
          <div class="field">
            <label for="fname">Nombre</label>
            <input
              id="fname"
              type="text"
              [(ngModel)]="form.name"
              placeholder="Nombre completo"
              [class.invalid]="submitted && !form.name.trim()"
            />
            @if (submitted && !form.name.trim()) {
              <span class="field-error">El nombre es obligatorio</span>
            }
          </div>

          <div class="field">
            <label for="femail">Email</label>
            <input
              id="femail"
              type="email"
              [(ngModel)]="form.email"
              placeholder="correo@ejemplo.com"
              [class.invalid]="submitted && !isValidEmail(form.email)"
            />
            @if (submitted && !isValidEmail(form.email)) {
              <span class="field-error">Email inválido</span>
            }
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" (click)="save()" [disabled]="loading()">
              @if (loading()) { ⏳ Guardando... }
              @else { {{ editId ? '💾 Actualizar' : '➕ Agregar' }} }
            </button>
            @if (editId) {
              <button class="btn btn-ghost" (click)="cancelEdit()">Cancelar</button>
            }
          </div>
        </div>
      </section>

      <!-- ── Tabla ───────────────────────────────────── -->
      <section class="card table-card">
        @if (loading() && !users().length) {
          <div class="empty-state">⏳ Cargando usuarios...</div>
        } @else if (!users().length) {
          <div class="empty-state">
            <span class="empty-icon">👤</span>
            <p>No hay usuarios registrados.</p>
            <p class="muted">Agrega el primero con el formulario de arriba.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user._id; let i = $index) {
                  <tr [class.editing-row]="editId === user._id">
                    <td class="muted">{{ i + 1 }}</td>
                    <td class="name-cell">
                      <span class="avatar">{{ user.name.charAt(0).toUpperCase() }}</span>
                      {{ user.name }}
                    </td>
                    <td class="muted">{{ user.email }}</td>
                    <td class="muted small">{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="actions-cell">
                      <button
                        class="btn btn-sm btn-edit"
                        (click)="startEdit(user)"
                        [disabled]="loading()"
                        title="Editar">
                        ✏️
                      </button>
                      <button
                        class="btn btn-sm btn-delete"
                        (click)="remove(user._id!)"
                        [disabled]="loading()"
                        title="Eliminar">
                        🗑️
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem 1rem;
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #1a1a2e;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    h1 { font-size: 1.6rem; font-weight: 700; color: #1a1a2e; }
    .subtitle { font-size: 0.82rem; color: #6b7280; margin-top: 2px; }
    .badge {
      background: #e0e7ff;
      color: #3730a3;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
    }

    /* Alertas */
    .alert {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.7rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
      padding: 0 4px;
    }
    .btn-close:hover { opacity: 1; }

    /* Cards */
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }

    /* Formulario */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.75rem;
      align-items: end;
    }
    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
    }
    .field { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 0.8rem; font-weight: 500; color: #6b7280; }
    input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #111827;
      background: #f9fafb;
      outline: none;
      transition: border 0.15s;
    }
    input:focus { border-color: #6366f1; background: #fff; }
    input.invalid { border-color: #ef4444; }
    .field-error { font-size: 0.75rem; color: #ef4444; }

    /* Botones */
    .form-actions { display: flex; gap: 8px; align-items: center; }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      border: 1px solid transparent;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #4f46e5; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #4338ca; }
    .btn-ghost { background: transparent; color: #6b7280; border-color: #d1d5db; }
    .btn-ghost:hover:not(:disabled) { background: #f3f4f6; }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }
    .btn-edit { background: #fffbeb; color: #92400e; border-color: #fde68a; }
    .btn-edit:hover:not(:disabled) { background: #fef3c7; }
    .btn-delete { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
    .btn-delete:hover:not(:disabled) { background: #fee2e2; }

    /* Tabla */
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th {
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }
    .editing-row td { background: #eff6ff !important; }
    .muted { color: #6b7280; }
    .small { font-size: 0.78rem; }
    .name-cell { display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .actions-cell { display: flex; gap: 6px; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 2.5rem 1rem;
      color: #9ca3af;
    }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .empty-state p { margin-bottom: 4px; font-size: 0.9rem; }
  `]
})
export class UserListComponent implements OnInit {
  private svc = inject(UserService);

  users   = signal<User[]>([]);
  loading = signal(false);
  errorMsg  = signal('');
  successMsg = signal('');

  form: { name: string; email: string } = { name: '', email: '' };
  editId: string | null = null;
  submitted = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: data => { this.users.set(data); this.loading.set(false); },
      error: () => { this.showError('No se pudo conectar con el servidor'); this.loading.set(false); }
    });
  }

  save() {
    this.submitted = true;
    if (!this.form.name.trim() || !this.isValidEmail(this.form.email)) return;

    this.loading.set(true);
    const op$ = this.editId
      ? this.svc.update(this.editId, this.form)
      : this.svc.create(this.form);

    op$.subscribe({
      next: () => {
        this.showSuccess(this.editId ? 'Usuario actualizado' : 'Usuario creado');
        this.cancelEdit();
        this.load();
      },
      error: err => {
        this.showError(err.error?.error || 'Error al guardar');
        this.loading.set(false);
      }
    });
  }

  startEdit(user: User) {
    this.editId = user._id!;
    this.form = { name: user.name, email: user.email };
    this.submitted = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editId = null;
    this.form = { name: '', email: '' };
    this.submitted = false;
    this.loading.set(false);
  }

  remove(id: string) {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.loading.set(true);
    this.svc.remove(id).subscribe({
      next: () => { this.showSuccess('Usuario eliminado'); this.load(); },
      error: () => { this.showError('Error al eliminar'); this.loading.set(false); }
    });
  }

  isValidEmail(email: string) {
    return /^\S+@\S+\.\S+$/.test(email);
  }

  private showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }
  private showError(msg: string) {
    this.errorMsg.set(msg);
  }
}
