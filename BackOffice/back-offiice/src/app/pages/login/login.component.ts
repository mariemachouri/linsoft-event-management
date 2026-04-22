import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private keycloakService: KeycloakService) { }

  ngOnInit(): void {
    // Redirect to Keycloak login automatically
    this.keycloakService.login({
      redirectUri: window.location.origin + '/#/'
    });
  }
}
