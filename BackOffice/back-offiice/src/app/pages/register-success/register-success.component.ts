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
    this.keycloakService.logout('http://localhost:4300');
  }
}
