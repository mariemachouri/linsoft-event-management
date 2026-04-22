import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, UserInfo } from "../../core/services/auth.service";

@Component({
  selector: "app-user",
  templateUrl: "user.component.html",
  styleUrls: ["user.component.scss"]
})
export class UserComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  private sub: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getDisplayName(): string {
    if (!this.currentUser) return '';
    const first = this.currentUser.firstName || '';
    const last = this.currentUser.lastName || '';
    return (first + ' ' + last).trim() || this.currentUser.username || '';
  }

  getPrimaryRole(): string {
    const roles = this.currentUser?.roles || [];
    if (roles.includes('admin')) return 'Administrator';
    if (roles.includes('event-organizer')) return 'Event Organizer';
    return roles[0] || 'User';
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
