import { Component } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {

  constructor(private keycloakService: KeycloakService) { }

  logout(): void {
    this.keycloakService.logout('http://localhost:4300');
  }
}
