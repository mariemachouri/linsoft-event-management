import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  isLoading = false;

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  login(): void {
    this.isLoading = true;
    this.keycloakService.login({
      redirectUri: window.location.origin + '/#/'
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
