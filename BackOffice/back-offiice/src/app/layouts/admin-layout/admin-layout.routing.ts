import { Routes } from "@angular/router";

import { DashboardComponent } from "../../pages/dashboard/dashboard.component";
import { IconsComponent } from "../../pages/icons/icons.component";
import { MapComponent } from "../../pages/map/map.component";
import { NotificationsComponent } from "../../pages/notifications/notifications.component";
import { UserComponent } from "../../pages/user/user.component";
import { TablesComponent } from "../../pages/tables/tables.component";
import { TypographyComponent } from "../../pages/typography/typography.component";
import { UsersListComponent } from "../../pages/users-list/users-list.component";
import { UserCreateComponent } from "../../pages/users-list/user-create/user-create.component";
import { UserEditComponent } from "../../pages/users-list/user-edit/user-edit.component";
import { EventsManagementComponent } from "../../pages/events-management/events-management.component";
import { EventCreateComponent } from "../../pages/events-management/event-create/event-create.component";
import { EventEditComponent } from "../../pages/events-management/event-edit/event-edit.component";
import { EventDetailComponent } from "../../pages/events-management/event-detail/event-detail.component";
import { RegistrationsManagementComponent } from "../../pages/registrations-management/registrations-management.component";
import { RegistrationCreateComponent } from "../../pages/registrations-management/registration-create/registration-create.component";
import { RegistrationEditComponent } from "../../pages/registrations-management/registration-edit/registration-edit.component";
import { ChargesManagementComponent } from "../../pages/charges-management/charges-management.component";
import { ChargePredictionCreateComponent } from "../../pages/charges-management/charge-prediction-create/charge-prediction-create.component";
import { ChargePaymentDecisionComponent } from "../../pages/charges-management/charge-payment-decision/charge-payment-decision.component";
import { NotificationsManagementComponent } from "../../pages/notifications-management/notifications-management.component";
import { RoleGuard } from "../../core/guards/role.guard";

export const AdminLayoutRoutes: Routes = [
  { path: "dashboard", component: DashboardComponent },
  { path: "events", component: EventsManagementComponent },
  {
    path: "events/create",
    component: EventCreateComponent
    // Guard temporairement désactivé pour le développement
    // canActivate: [RoleGuard],
    // data: { roles: ['admin', 'event-organizer'] }
  },
  {
    path: "events/view/:id",
    component: EventDetailComponent
  },
  {
    path: "events/edit/:id",
    component: EventEditComponent
    // Guard temporairement désactivé pour le développement
    // canActivate: [RoleGuard],
    // data: { roles: ['admin', 'event-organizer'] }
  },
  { path: "registrations", component: RegistrationsManagementComponent },
  {
    path: "registrations/create",
    component: RegistrationCreateComponent
  },
  {
    path: "registrations/edit/:id",
    component: RegistrationEditComponent
  },
  { path: "charges", component: ChargesManagementComponent },
  {
    path: "charges/create",
    component: ChargePredictionCreateComponent
    // Guard temporairement désactivé pour le développement
    // canActivate: [RoleGuard],
    // data: { roles: ['admin', 'event-organizer'] }
  },
  {
    path: "charges/payment-decision/:id",
    component: ChargePaymentDecisionComponent
    // Guard temporairement désactivé pour le développement
    // canActivate: [RoleGuard],
    // data: { roles: ['admin', 'event-organizer'] }
  },
  { path: "notifications", component: NotificationsManagementComponent },
  { 
    path: "users", 
    component: UsersListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: "users/create",
    component: UserCreateComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: "users/edit/:id",
    component: UserEditComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  // User & Settings pages
  { path: "user-profile", component: UserComponent },
  { path: "settings", component: UserComponent },
  // Legacy routes
  { path: "icons", component: IconsComponent },
  { path: "maps", component: MapComponent },
  { path: "user", component: UserComponent },
  { path: "tables", component: TablesComponent },
  { path: "typography", component: TypographyComponent }
];

