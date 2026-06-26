import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;
  private readonly REFRESH_BUFFER_MS = 30_000; // rafraîchir 30s avant expiry
  private refreshing: Promise<string> | null = null;

  constructor(private keycloakService: KeycloakService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const kc = this.keycloakService.getKeycloakInstance();
    const hasSession = !!kc?.authenticated || !!localStorage.getItem('bo_refresh_token');
    if (!hasSession) {
      return next.handle(request);
    }

    // Utiliser le token en cache si encore valide → évite un refresh inutile
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - this.REFRESH_BUFFER_MS) {
      return next.handle(this._withToken(request, this.cachedToken)).pipe(
        catchError(err => this._onError(err))
      );
    }

    // Sinon obtenir un token frais (depuis l'instance keycloak ou via refresh users-service)
    return from(this._getFreshToken()).pipe(
      switchMap(token =>
        next.handle(this._withToken(request, token)).pipe(catchError(err => this._onError(err)))
      ),
      catchError(err => this._onError(err))
    );
  }

  /** Renvoie le token courant s'il est encore valide, sinon le rafraîchit. */
  private async _getFreshToken(): Promise<string> {
    const current = this.keycloakService.getKeycloakInstance()?.token;
    if (current && Date.now() < this._exp(current) - this.REFRESH_BUFFER_MS) {
      this._saveToken(current);
      return current;
    }
    return this._refreshViaUsersService();
  }

  /**
   * Le token a été émis pour le client "users-service" (login FrontOffice unifié) :
   * on rafraîchit donc via l'endpoint users-service et non via keycloak-js (backoffice-client).
   */
  private _refreshViaUsersService(): Promise<string> {
    if (this.refreshing) return this.refreshing;

    const refreshToken = localStorage.getItem('bo_refresh_token');
    if (!refreshToken) return Promise.reject(new Error('no refresh token'));

    this.refreshing = fetch(`${environment.apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(res => {
        if (!res.ok) throw new Error('refresh failed');
        return res.json();
      })
      .then((data: { access_token: string; refresh_token: string }) => {
        const newToken = data.access_token;
        localStorage.setItem('bo_access_token', newToken);
        if (data.refresh_token) {
          localStorage.setItem('bo_refresh_token', data.refresh_token);
        }
        // Synchroniser l'instance keycloak pour rester cohérent (rôles, profil, isLoggedIn)
        const kc = this.keycloakService.getKeycloakInstance();
        if (kc) {
          kc.token = newToken;
          kc.refreshToken = data.refresh_token;
          try { kc.tokenParsed = JSON.parse(atob(newToken.split('.')[1])); } catch { /* ignore */ }
        }
        this._saveToken(newToken);
        return newToken;
      })
      .finally(() => { this.refreshing = null; });

    return this.refreshing;
  }

  private _withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private _saveToken(token: string): void {
    this.cachedToken = token;
    this.tokenExpiresAt = this._exp(token);
  }

  private _exp(token: string): number {
    try {
      return JSON.parse(atob(token.split('.')[1])).exp * 1000;
    } catch {
      return Date.now() + 300_000; // fallback 5 min
    }
  }

  private _onError(error: any): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      // Session invalide → nettoyage et renvoi vers le login unifié du FrontOffice
      this.cachedToken = null;
      localStorage.removeItem('bo_access_token');
      localStorage.removeItem('bo_refresh_token');
      window.location.href = 'http://localhost:4300/login';
    }
    return throwError(() => error);
  }
}
