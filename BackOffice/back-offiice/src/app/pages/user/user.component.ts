import { Component, OnInit } from "@angular/core";
import { AuthService, UserInfo } from "../../core/services/auth.service";

@Component({
  selector: "app-user",
  templateUrl: "user.component.html",
  styleUrls: ["user.component.scss"]
})
export class UserComponent implements OnInit {
  currentUser: UserInfo | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Récupérer les informations de l'utilisateur connecté
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);
  }
}
