import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

// Roles autorisés à accéder au BackOffice
const ALLOWED_ROLES = ['admin', 'organisateur', 'organizer', 'event-organizer'];

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {

  constructor(
    protected readonly router: Router,
    protected readonly keycloak: KeycloakService
  ) {
    super(router, keycloak);
  }

  async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Non authentifié → renvoyer vers le login unifié du FrontOffice (pas de formulaire Keycloak)
    if (!this.authenticated) {
      window.location.href = 'http://localhost:4300/login';
      return false;
    }

    // Récupérer tous les rôles (realm + resource)
    const userRoles = this.keycloak.getUserRoles(true);
    const hasAccess = ALLOWED_ROLES.some(role => userRoles.includes(role));

    if (!hasAccess) {
      // Participant ou user sans rôle BackOffice → renvoyer vers le FrontOffice
      window.location.href = 'http://localhost:4300/home';
      return false;
    }

    return true;
  }
}

