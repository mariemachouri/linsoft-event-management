import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  isLoading = false;
  email = '';
  password = '';
  rememberMe = false;
  private returnUrl = '/';

  constructor(
    private keycloakService: KeycloakService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.queryParamMap.get('returnUrl');
    if (param) this.returnUrl = param;

    // Login unifié : le BackOffice n'affiche plus de formulaire propre.
    // Tout accès non authentifié est renvoyé vers le login du FrontOffice.
    window.location.href = 'http://localhost:4300/login';
  }

  login(): void {
    window.location.href = 'http://localhost:4300/login';
  }

  forgotPassword(): void {
    this.keycloakService.login({
      action: 'RESET_CREDENTIALS',
      redirectUri: window.location.origin + '/#/'
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
