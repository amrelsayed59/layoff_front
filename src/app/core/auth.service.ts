import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';

import { API_BASE_URL } from './api.tokens';

const TOKEN_STORAGE_KEY = 'layoff-egypt-access-token';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface JwtClaims {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

/**
 * JWT-based auth client for the single seeded admin user (no registration).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly tokenSig = signal<string | null>(this.readToken());

  /** Reactive logged-in state for guards/components. */
  readonly isLoggedIn = computed(() => !!this.tokenSig());

  /**
   * Calls `POST /auth/login` and stores the returned access token.
   */
  login(email: string, password: string) {
    const body: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, body).pipe(
      map((res) => res.access_token),
      tap((token) => this.setToken(token)),
    );
  }

  /** Clears the stored token (logout). */
  logout(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // SSR / restricted storage: treat as logged out.
    }
    this.tokenSig.set(null);
  }

  /** Returns the current access token if present. */
  getToken(): string | null {
    return this.tokenSig();
  }

  /** Decodes the JWT payload (no signature verification on the client). */
  getClaims(): JwtClaims | null {
    const token = this.getToken();
    if (!token) return null;
    return decodeJwtClaims(token);
  }

  private setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // SSR / restricted storage: keep token in-memory for the current session only.
    }
    this.tokenSig.set(token);
  }

  private readToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      return token && token.trim().length > 0 ? token : null;
    } catch {
      return null;
    }
  }
}

/**
 * Decodes JWT claims from a compact JWS string.
 * @returns Parsed claims or null if token is malformed.
 */
export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

