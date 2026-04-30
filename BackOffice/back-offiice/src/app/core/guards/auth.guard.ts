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
    // Rediriger vers Keycloak si non authentifié
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin + '/#' + state.url,
      });
      return false;
    }

    // Récupérer tous les rôles (realm + resource)
    const userRoles = this.keycloak.getUserRoles(true);
    const hasAccess = ALLOWED_ROLES.some(role => userRoles.includes(role));

    if (!hasAccess) {
      // Si l'utilisateur vient d'une connexion sociale (participant), rediriger vers register-success
      // Sinon, afficher la page unauthorized
      const isParticipant = userRoles.includes('participant');
      if (isParticipant) {
        this.router.navigate(['/register-success']);
      } else {
        this.router.navigate(['/unauthorized']);
      }
      return false;
    }

    return true;
  }
}

