import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.keycloakService.isLoggedIn()) {
      return next.handle(request);
    }

    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        const authRequest = request.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next.handle(authRequest).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.keycloakService.logout(window.location.origin + '/#/login');
            }
            return throwError(() => error);
          })
        );
      })
    );
  }
}

