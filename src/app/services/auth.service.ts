import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class AuthService {
  private url = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<any>(`${this.url}/login`, { email, password });
  }

  registro(data: any) {
    return this.http.post<any>(`${this.url}/registro`, data);
  }

  guardarSesion(token: string, nombre: string, rol: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("nombre", nombre);
    localStorage.setItem("rol", rol);
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(["/login"]);
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  getNombre(): string {
    return localStorage.getItem("nombre") || "";
  }

  getRol(): string {
    return localStorage.getItem("rol") || "";
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem("token");
  }

  isAdmin(): boolean {
    return localStorage.getItem("rol") === "admin";
  }
}
