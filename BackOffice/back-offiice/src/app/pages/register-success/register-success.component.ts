import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

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
    localStorage.removeItem('bo_refresh_token');
    window.location.href = `${environment.frontOfficeUrl}/login`;
  }
}
