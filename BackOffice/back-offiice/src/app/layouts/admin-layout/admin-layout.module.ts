import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AdminLayoutRoutes } from "./admin-layout.routing";
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
import { PushNotificationsComponent } from "../../pages/push-notifications/push-notifications.component";
// import { RtlComponent } from "../../pages/rtl/rtl.component";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
  ],
  declarations: [
    DashboardComponent,
    UserComponent,
    TablesComponent,
    IconsComponent,
    TypographyComponent,
    NotificationsComponent,
    MapComponent,
    UsersListComponent,
    UserCreateComponent,
    UserEditComponent,
    EventsManagementComponent,
    EventCreateComponent,
    EventDetailComponent,
    EventEditComponent,
    RegistrationsManagementComponent,
    RegistrationCreateComponent,
    RegistrationEditComponent,
    ChargesManagementComponent,
    ChargePredictionCreateComponent,
    ChargePaymentDecisionComponent,
    NotificationsManagementComponent,
    PushNotificationsComponent,
    // RtlComponent
  ]
})
export class AdminLayoutModule {}
