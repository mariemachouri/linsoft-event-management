import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service partagé pour la photo de profil (avatar).
 * Stockée en localStorage (clé: backoffice_avatar_<userId>) et diffusée
 * via un BehaviorSubject pour synchroniser navbar ↔ page profil en direct.
 */
@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly PREFIX = 'backoffice_avatar_';
  private subject = new BehaviorSubject<string | null>(null);
  public avatar$: Observable<string | null> = this.subject.asObservable();

  private key(userId: string): string {
    return `${this.PREFIX}${userId}`;
  }

  /** Charge l'avatar depuis localStorage et le diffuse. */
  load(userId: string): void {
    if (!userId) { this.subject.next(null); return; }
    const value = localStorage.getItem(this.key(userId));
    this.subject.next(value || null);
  }

  /** Définit un nouvel avatar (base64), persiste et diffuse. */
  set(userId: string, dataUrl: string): void {
    if (!userId) return;
    localStorage.setItem(this.key(userId), dataUrl);
    this.subject.next(dataUrl);
  }

  /** Supprime l'avatar. */
  clear(userId: string): void {
    if (!userId) return;
    localStorage.removeItem(this.key(userId));
    this.subject.next(null);
  }

  /** Valeur courante (synchronisée). */
  get current(): string | null {
    return this.subject.value;
  }
}
