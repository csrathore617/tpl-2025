import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser } from '../types/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.user$.asObservable();

  constructor() {
    const stored = localStorage.getItem('tpl_user');
    if (stored) this.user$.next(JSON.parse(stored));
  }

  login(user: AuthUser) {
    localStorage.setItem('tpl_token', user.token);
    localStorage.setItem('tpl_user', JSON.stringify(user));
    this.user$.next(user);
  }

  logout() {
    localStorage.removeItem('tpl_token');
    localStorage.removeItem('tpl_user');
    this.user$.next(null);
  }

  get currentUser(): AuthUser | null { return this.user$.value; }
  get isAdmin(): boolean { return this.user$.value?.role === 'admin'; }
  get isTeamOwner(): boolean { return this.user$.value?.role === 'team_owner'; }
  get isLoggedIn(): boolean { return !!this.user$.value; }
}
