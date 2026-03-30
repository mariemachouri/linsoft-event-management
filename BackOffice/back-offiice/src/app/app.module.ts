import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from "./app.component";
import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { AppRoutingModule } from "./app-routing.module";
import { ComponentsModule } from "./components/components.module";
import { AuthInterceptor } from "./core/interceptors/auth.interceptor";
import { LoginComponent } from "./pages/login/login.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { EventsManagementComponent } from './pages/events-management/events-management.component';
import { RegistrationsManagementComponent } from './pages/registrations-management/registrations-management.component';
import { ChargesManagementComponent } from './pages/charges-management/charges-management.component';
import { NotificationsManagementComponent } from './pages/notifications-management/notifications-management.component';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    ToastrModule.forRoot()
  ],
  declarations: [
    AppComponent, 
    AdminLayoutComponent, 
    AuthLayoutComponent,
    LoginComponent,
    UsersListComponent,
    EventsManagementComponent,
    RegistrationsManagementComponent,
    ChargesManagementComponent,
    NotificationsManagementComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
