import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;
  private readonly REFRESH_BUFFER_MS = 30_000; // rafraîchir 30s avant expiry

  constructor(private keycloakService: KeycloakService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.keycloakService.isLoggedIn()) {
      return next.handle(request);
    }

    // Utiliser le token en cache si encore valide → évite 1 Promise async par requête
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - this.REFRESH_BUFFER_MS) {
      return next.handle(this._withToken(request, this.cachedToken)).pipe(
        catchError(err => this._onError(err))
      );
    }

    // Récupérer un nouveau token (seulement si expiré ou absent)
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        this._saveToken(token);
        return next.handle(this._withToken(request, token)).pipe(
          catchError(err => this._onError(err))
        );
      })
    );
  }

  private _withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private _saveToken(token: string): void {
    this.cachedToken = token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.tokenExpiresAt = payload.exp * 1000;
    } catch {
      this.tokenExpiresAt = Date.now() + 300_000; // fallback 5 min
    }
  }

  private _onError(error: any): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.cachedToken = null; // invalider le cache sur 401
      window.location.href =
        `http://localhost:8180/realms/event-mgmt/protocol/openid-connect/logout` +
        `?client_id=backoffice-client` +
        `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:4200/')}`;
    }
    return throwError(() => error);
  }
}
