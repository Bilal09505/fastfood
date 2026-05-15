// src/app/core/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { AuthUser, LoginResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'ff_access_token';
  private readonly REFRESH_KEY = 'ff_refresh_token';
  private readonly USER_KEY = 'ff_user';

  // ── Signals ────────────────────────────────────────────────────────────
  currentUser = signal<AuthUser | null>(this.loadUser());
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin    = computed(() => this.currentUser()?.role === 'ADMIN');
  isSalesman = computed(() => this.currentUser()?.role === 'SALESMAN');
  isMaker    = computed(() => this.currentUser()?.role === 'MAKER');
  isSupplier = computed(() => this.currentUser()?.role === 'SUPPLIER');

  // ── Auth ───────────────────────────────────────────────────────────────
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshTokens() {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) return null;
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${environment.apiUrl}/auth/refresh`, { refreshToken }
    ).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
