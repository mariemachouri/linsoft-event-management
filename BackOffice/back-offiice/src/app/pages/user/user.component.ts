import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, UserInfo } from "../../core/services/auth.service";

@Component({
  selector: "app-user",
  templateUrl: "user.component.html",
  styleUrls: ["user.component.scss"]
})
export class UserComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  photoUrl: string | null = null;
  private sub: Subscription = new Subscription();

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.id) {
        this.photoUrl = localStorage.getItem(`backoffice_avatar_${user.id}`) || null;
      }
    });
  }

  triggerPhotoUpload(): void {
    this.photoInput?.nativeElement?.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.photoUrl = base64;
      if (this.currentUser?.id) {
        localStorage.setItem(`backoffice_avatar_${this.currentUser.id}`, base64);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    input.value = '';
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
