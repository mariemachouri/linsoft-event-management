import { Component } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {

  constructor(private keycloakService: KeycloakService) { }

  logout(): void {
    window.location.href =
      `http://localhost:8180/realms/event-mgmt/protocol/openid-connect/logout` +
      `?client_id=backoffice-client` +
      `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:4300/')}`;
  }
}
