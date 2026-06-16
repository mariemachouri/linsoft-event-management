import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

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
    if (this.keycloakService.isLoggedIn()) {
      try {
        const profile: KeycloakProfile = await this.keycloakService.loadUserProfile();
        const roles = this.keycloakService.getUserRoles();
        const userInfo: UserInfo = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          roles
        };
        this.currentUserSubject.next(userInfo);
      } catch (e) {
        console.error('Failed to load Keycloak user profile', e);
      }
    }
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
    // Bypass keycloak-angular to avoid id_token_hint which causes Keycloak to reject the redirect
    const logoutUrl =
      `http://localhost:8180/realms/event-mgmt/protocol/openid-connect/logout` +
      `?client_id=backoffice-client` +
      `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:4200/')}`;
    window.location.href = logoutUrl;
  }
}

