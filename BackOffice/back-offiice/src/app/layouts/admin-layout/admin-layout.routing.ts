import { Routes } from "@angular/router";

import { DashboardComponent } from "../../pages/dashboard/dashboard.component";
import { IconsComponent } from "../../pages/icons/icons.component";
import { MapComponent } from "../../pages/map/map.component";
import { NotificationsComponent } from "../../pages/notifications/notifications.component";
import { UserComponent } from "../../pages/user/user.component";
import { TablesComponent } from "../../pages/tables/tables.component";
import { TypographyComponent } from "../../pages/typography/typography.component";
import { UsersListComponent } from "../../pages/users-list/users-list.component";
import { EventsManagementComponent } from "../../pages/events-management/events-management.component";
import { RegistrationsManagementComponent } from "../../pages/registrations-management/registrations-management.component";
import { ChargesManagementComponent } from "../../pages/charges-management/charges-management.component";
import { NotificationsManagementComponent } from "../../pages/notifications-management/notifications-management.component";
import { RoleGuard } from "../../core/guards/role.guard";

export const AdminLayoutRoutes: Routes = [
  { path: "dashboard", component: DashboardComponent },
  { path: "events", component: EventsManagementComponent },
  { path: "registrations", component: RegistrationsManagementComponent },
  { path: "charges", component: ChargesManagementComponent },
  { path: "notifications", component: NotificationsManagementComponent },
  { 
    path: "users", 
    component: UsersListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  // Legacy routes
  { path: "icons", component: IconsComponent },
  { path: "maps", component: MapComponent },
  { path: "user", component: UserComponent },
  { path: "tables", component: TablesComponent },
  { path: "typography", component: TypographyComponent }
];

