import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-register-success',
  templateUrl: './register-success.component.html',
  styleUrls: ['./register-success.component.scss']
})
export class RegisterSuccessComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';

  constructor(private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    try {
      const profile = this.keycloakService.getKeycloakInstance().idTokenParsed;
      if (profile) {
        this.userName = profile['given_name'] || profile['preferred_username'] || '';
        this.userEmail = profile['email'] || '';
      }
    } catch (e) {}
  }

  logout(): void {
    window.location.href =
      `http://localhost:8180/realms/event-mgmt/protocol/openid-connect/logout` +
      `?client_id=backoffice-client` +
      `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:4300/')}`;
  }
}
