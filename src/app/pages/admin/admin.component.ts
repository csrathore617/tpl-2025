import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div style="padding:1.5rem;border-bottom:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:1.4rem;font-weight:700;color:var(--primary)">🏏 TPL2026</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Admin Panel</div>
        </div>
        <nav style="padding:1rem 0">
          <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="active" class="admin-nav-item">
            <span>{{ item.icon }}</span>{{ item.label }}
          </a>
        </nav>
        <div style="padding:1rem 1.5rem;border-top:1px solid var(--border);margin-top:auto">
          <button class="btn btn-secondary btn-sm" style="width:100%" (click)="logout()">Logout</button>
        </div>
      </aside>
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; min-height: 100vh; }
    .admin-sidebar { display: flex; flex-direction: column; }
    @media (max-width: 768px) {
      .admin-layout { flex-direction: column; }
      .admin-sidebar { width: 100%; min-height: auto; position: relative; }
      .admin-content { margin-left: 0; }
    }
  `]
})
export class AdminComponent implements OnInit {
  navItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/players', icon: '🏏', label: 'Players' },
    { path: '/admin/teams', icon: '🏆', label: 'Teams' },
    { path: '/admin/auction', icon: '🔴', label: 'Auction Control' },
    { path: '/admin/announcements', icon: '📢', label: 'Announcements' },
    { path: '/admin/seasons', icon: '🏅', label: 'Seasons' },
    { path: '/admin/gallery', icon: '🖼️', label: 'Gallery' },
    { path: '/admin/sessions', icon: '📅', label: 'Sessions' },
    { path: '/admin/tournament-settings', icon: '🏟️', label: 'Venue & Contact' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    { path: '/admin/audit', icon: '📋', label: 'Audit Log' },
    { path: '/admin/backup', icon: '📦', label: 'Backup & Data' }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.auth.isAdmin) this.router.navigate(['/login']);
  }

  logout() { this.auth.logout(); this.router.navigate(['/']); }
}
