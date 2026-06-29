import { Component } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {

  constructor(private keycloakService: KeycloakService) { }

  logout(): void {
    // Login unifié : nettoyage local puis retour vers le FrontOffice
    localStorage.removeItem('bo_refresh_token');
    window.location.href = `${environment.frontOfficeUrl}/login`;
  }
}
