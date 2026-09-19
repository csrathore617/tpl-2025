import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="container nav-inner">
        <a routerLink="/" class="brand">
          <span class="brand-icon">🏏</span>
          <div>
            <div class="brand-name">TPL2026</div>
            <div class="brand-sub">T10 Cricket League</div>
          </div>
        </a>

        <button class="hamburger" (click)="menuOpen = !menuOpen" [class.open]="menuOpen">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-links" [class.open]="menuOpen" (click)="menuOpen=false">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">Home</a>
          <a routerLink="/players" routerLinkActive="active" class="nav-link">Players</a>
          <a routerLink="/teams" routerLinkActive="active" class="nav-link">Teams</a>
          <a routerLink="/auction" routerLinkActive="active" class="nav-link" [class.live]="isLive">
            <span *ngIf="isLive" class="live-dot"></span>
            Auction<span *ngIf="isLive"> 🔴</span>
          </a>
          <a routerLink="/rules" routerLinkActive="active" class="nav-link">Rules</a>
          <a routerLink="/tournament" routerLinkActive="active" class="nav-link">Tournament</a>
          <a routerLink="/sessions" routerLinkActive="active" class="nav-link">Sessions</a>
          <a routerLink="/previous-seasons" routerLinkActive="active" class="nav-link">Seasons</a>
          <a routerLink="/gallery" routerLinkActive="active" class="nav-link">Gallery</a>
          <a routerLink="/venue-contact" routerLinkActive="active" class="nav-link">Venue</a>
          <ng-container *ngIf="!auth.isLoggedIn">
            <a routerLink="/login" routerLinkActive="active" class="nav-link">Login</a>
          </ng-container>
          <ng-container *ngIf="auth.isAdmin">
            <a routerLink="/admin" routerLinkActive="active" class="nav-link" style="color:var(--primary)">Admin</a>
            <button class="btn btn-secondary btn-sm" (click)="logout()">Logout</button>
          </ng-container>
          <ng-container *ngIf="auth.isTeamOwner">
            <span class="nav-link" style="color:var(--accent)">{{ auth.currentUser?.teamName }}</span>
            <button class="btn btn-secondary btn-sm" (click)="logout()">Logout</button>
          </ng-container>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: rgba(10,15,30,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 500; }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-icon { font-size: 1.8rem; }
    .brand-name { font-family: 'Rajdhani', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--primary); line-height: 1; }
    .brand-sub { font-size: 0.65rem; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }
    .nav-links { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
    .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; z-index: 10; }
    .hamburger span { display: block; width: 24px; height: 2px; background: var(--text); border-radius: 2px; transition: all 0.3s; }
    @media (max-width: 1024px) {
      .hamburger { display: flex; }
      .nav-links { display: none; position: fixed; top: 64px; left: 0; right: 0; bottom: 0; background: var(--bg-card); border-bottom: 1px solid var(--border); flex-direction: column; padding: 1rem; gap: 4px; align-items: flex-start; overflow-y: auto; z-index: 499; }
      .nav-links.open { display: flex; }
      .nav-link { width: 100%; padding: 10px 16px; font-size: 1rem; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLive = false;
  menuOpen = false;
  private sub?: Subscription;

  constructor(public auth: AuthService, private socket: SocketService) {}

  ngOnInit() {
    this.sub = this.socket.events$.subscribe(({ event, data }) => {
      if (event === 'AUCTION_STARTED') this.isLive = true;
      if (event === 'AUCTION_STATE') this.isLive = data.state === 'LIVE';
      if (['PLAYER_SOLD','PLAYER_UNSOLD','AUCTION_COMPLETED'].includes(event)) this.isLive = false;
    });
  }

  logout() { this.auth.logout(); }
  ngOnDestroy() { this.sub?.unsubscribe(); }
}
