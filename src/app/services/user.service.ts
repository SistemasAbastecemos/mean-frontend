// src/app/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id?: string;
  name: string;
  email: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/users`;

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }

  create(data: Omit<User, '_id' | 'createdAt'>): Observable<User> {
    return this.http.post<User>(this.url, data);
  }

  update(id: string, data: Omit<User, '_id' | 'createdAt'>): Observable<User> {
    return this.http.put<User>(`${this.url}/${id}`, data);
  }

  remove(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.url}/${id}`);
  }
}
