import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ToastrModule } from 'ngx-toastr';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

import { AppComponent } from "./app.component";
import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { AppRoutingModule } from "./app-routing.module";
import { ComponentsModule } from "./components/components.module";
import { AuthInterceptor } from "./core/interceptors/auth.interceptor";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { UnauthorizedComponent } from "./pages/unauthorized/unauthorized.component";
import { RegisterSuccessComponent } from "./pages/register-success/register-success.component";
import { environment } from "../environments/environment";

function isJwtExpired(token: string): boolean {
  try {
    const exp = JSON.parse(atob(token.split('.')[1])).exp * 1000;
    return Date.now() >= exp - 30_000;
  } catch {
    return true;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const res = await fetch(`${environment.apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function initializeKeycloak(keycloak: KeycloakService) {
  return async () => {
    // Tokens transmis par le FrontOffice (login unifié) via la query string.
    // Permet d'authentifier l'admin/organisateur sans afficher le formulaire Keycloak.
    const params = new URLSearchParams(window.location.search);
    let token = params.get('access_token') ?? undefined;
    let refreshToken = params.get('refresh_token') ?? undefined;

    if (token) {
      // Retirer les tokens de l'URL (en conservant le hash de route Angular)
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      // Rechargement de page (F5) : restaurer la session depuis le localStorage
      const storedToken = localStorage.getItem('bo_access_token') ?? undefined;
      const storedRefresh = localStorage.getItem('bo_refresh_token') ?? undefined;
      if (storedToken && !isJwtExpired(storedToken)) {
        token = storedToken;
        refreshToken = storedRefresh;
      } else if (storedRefresh) {
        // Token expiré → tenter un rafraîchissement via users-service
        const refreshed = await refreshAccessToken(storedRefresh);
        if (refreshed) {
          token = refreshed.access_token;
          refreshToken = refreshed.refresh_token;
        }
      }
    }

    // Persister la session pour survivre aux rechargements
    if (token) {
      localStorage.setItem('bo_access_token', token);
      if (refreshToken) localStorage.setItem('bo_refresh_token', refreshToken);
    }

    try {
      await keycloak.init({
        config: {
          url: environment.keycloak.url,
          realm: environment.keycloak.realm,
          clientId: environment.keycloak.clientId,
        },
        // Désactivé : le bearer interceptor de keycloak-angular appelle updateToken()
        // sur backoffice-client → 400 (token émis pour users-service). Notre AuthInterceptor
        // ajoute le token et gère le refresh via users-service.
        enableBearerInterceptor: false,
        // Pas de token fourni → check-sso classique (accès direct sans token = renvoyé
        // vers le FrontOffice par le guard). Si token fourni → init "vide", puis injection manuelle.
        initOptions: token
          ? { checkLoginIframe: false }
          : {
              onLoad: 'check-sso',
              silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
              pkceMethod: 'S256',
              checkLoginIframe: false,
            },
        bearerExcludedUrls: []
      });
    } catch {
      console.warn('Keycloak not available – running without authentication.');
    }

    // Injection manuelle du token issu du FrontOffice.
    // On NE passe PAS token/refreshToken à init() : keycloak-js 18 déclencherait un
    // updateToken(-1) sur backoffice-client, qui échoue (token émis pour users-service).
    if (token) {
      try {
        const kc = keycloak.getKeycloakInstance();
        const parsed: any = JSON.parse(atob(token.split('.')[1]));
        kc.token = token;
        kc.tokenParsed = parsed;
        kc.refreshToken = refreshToken;
        kc.authenticated = true;
        kc.subject = parsed.sub;
        kc.realmAccess = parsed.realm_access;
        kc.resourceAccess = parsed.resource_access;
      } catch (e) {
        console.error('Échec de l\'injection du token transmis par le FrontOffice', e);
      }
    }
  };
}

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    AppRoutingModule,
    ToastrModule.forRoot(),
    KeycloakAngularModule
  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    AuthLayoutComponent,
    LoginComponent,
    RegisterComponent,
    UnauthorizedComponent,
    RegisterSuccessComponent
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
