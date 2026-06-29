import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

export interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject: BehaviorSubject<UserInfo | null>;
  public currentUser$: Observable<UserInfo | null>;

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.loadUserProfile();
  }

  private async loadUserProfile(): Promise<void> {
    const kc = this.keycloakService.getKeycloakInstance();
    if (!kc?.authenticated) {
      return;
    }
    // Lire les infos directement depuis les claims du JWT (token injecté par le FrontOffice).
    // Plus fiable que l'endpoint /account avec un token émis pour le client users-service.
    const claims: any = kc.tokenParsed ?? {};
    const roles = this.keycloakService.getUserRoles(true);
    const userInfo: UserInfo = {
      id: claims.sub,
      username: claims.preferred_username,
      email: claims.email,
      firstName: claims.given_name,
      lastName: claims.family_name,
      roles
    };
    this.currentUserSubject.next(userInfo);
  }

  isAuthenticated(): boolean {
    return !!this.keycloakService.getKeycloakInstance()?.authenticated;
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string {
    const user = this.getCurrentUser();
    return user?.id || user?.username || 'unknown';
  }

  hasRole(role: string): boolean {
    return this.keycloakService.isUserInRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.keycloakService.isUserInRole(role));
  }

  getToken(): Observable<string> {
    return from(this.keycloakService.getToken());
  }

  login(idpHint?: string): void {
    this.keycloakService.login({
      redirectUri: window.location.origin + '/#/',
      ...(idpHint && { idpHint })
    });
  }

  register(idpHint?: string): void {
    this.keycloakService.register({
      redirectUri: window.location.origin + '/#/',
      ...(idpHint && { idpHint })
    });
  }

  logout(): void {
    // Login unifié : pas de session SSO Keycloak côté BackOffice (tokens injectés).
    // On nettoie le token local puis on renvoie vers le login du FrontOffice.
    localStorage.removeItem('bo_access_token');
    localStorage.removeItem('bo_refresh_token');
    const kc = this.keycloakService.getKeycloakInstance();
    if (kc) {
      kc.token = undefined;
      kc.refreshToken = undefined;
      kc.authenticated = false;
    }
    window.location.href = `${environment.frontOfficeUrl}/login`;
  }
}

