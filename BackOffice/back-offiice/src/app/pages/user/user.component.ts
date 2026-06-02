import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, UserInfo } from "../../core/services/auth.service";
import { AvatarService } from "../../core/services/avatar.service";

@Component({
  selector: "app-user",
  templateUrl: "user.component.html",
  styleUrls: ["user.component.scss"]
})
export class UserComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  photoUrl: string | null = null;
  private userId: string = '';
  private sub: Subscription = new Subscription();

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService
  ) {}

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.userId = user?.id || user?.username || '';
      if (this.userId) {
        this.avatarService.load(this.userId);
      }
    });
    // Synchronisé en direct avec la navbar (et inversement)
    this.sub.add(
      this.avatarService.avatar$.subscribe(url => this.photoUrl = url)
    );
  }

  triggerPhotoUpload(): void {
    this.photoInput?.nativeElement?.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("L'image doit faire moins de 2 Mo.");
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (this.userId) {
        this.avatarService.set(this.userId, base64);
      } else {
        this.photoUrl = base64;
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
