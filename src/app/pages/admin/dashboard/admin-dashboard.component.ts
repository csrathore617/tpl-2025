import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Stats } from '../../../types/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding:2rem">
      <h1 style="margin-bottom:0.5rem">Dashboard</h1>
      <p style="color:var(--text-muted);margin-bottom:2rem">TPL2026 Tournament Overview</p>

      <div class="grid grid-4" *ngIf="stats">
        <div class="stat-card" *ngFor="let s of statCards">
          <div class="stat-value" [style.color]="s.color">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
      <div class="grid grid-4" *ngIf="!stats">
        <div class="stat-card skeleton" style="height:100px" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
      </div>

      <div class="grid grid-2" style="margin-top:2rem">
        <div class="card">
          <h3 style="margin-bottom:1rem">Quick Actions</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            <a routerLink="/admin/auction" class="btn btn-primary">🔴 Auction Control</a>
            <a routerLink="/admin/players" class="btn btn-secondary">🏏 Manage Players</a>
            <a routerLink="/admin/teams" class="btn btn-secondary">🏆 Manage Teams</a>
            <a routerLink="/admin/announcements" class="btn btn-secondary">📢 Announcements</a>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:1rem">Auction Status</h3>
          <div class="auction-status-display">
            <div class="big-status" [class]="'status-' + (stats?.auctionState || 'NOT_STARTED').toLowerCase()">
              {{ stats?.auctionState || 'NOT_STARTED' }}
            </div>
            <p style="color:var(--text-muted);margin-top:1rem;font-size:0.9rem">
              {{ getStatusDesc(stats?.auctionState) }}
            </p>
            <a routerLink="/admin/auction" class="btn btn-primary" style="margin-top:1rem">Go to Auction Control</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auction-status-display { text-align: center; }
    .big-status { font-size: 2rem; font-weight: 800; font-family: 'Rajdhani',sans-serif; padding: 1rem; border-radius: 8px; }
    .status-live { color: #f87171; background: rgba(239,68,68,0.1); }
    .status-paused { color: #fbbf24; background: rgba(245,158,11,0.1); }
    .status-not_started { color: #94a3b8; background: rgba(148,163,184,0.1); }
    .status-completed { color: #4ade80; background: rgba(34,197,94,0.1); }
    .status-ready { color: #60a5fa; background: rgba(59,130,246,0.1); }
    .status-sold { color: #4ade80; background: rgba(34,197,94,0.1); }
    .status-unsold { color: #94a3b8; background: rgba(148,163,184,0.1); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: Stats | null = null;
  statCards: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getStats().subscribe(s => {
      this.stats = s;
      this.statCards = [
        { label: 'Total Players', value: s.totalPlayers, color: 'var(--primary)' },
        { label: 'Verified Players', value: s.verifiedPlayers, color: 'var(--info)' },
        { label: 'Available Players', value: s.availablePlayers, color: 'var(--warning)' },
        { label: 'Sold Players', value: s.soldPlayers, color: 'var(--success)' },
        { label: 'Unsold Players', value: s.unsoldPlayers, color: 'var(--text-muted)' },
        { label: 'Total Teams', value: s.totalTeams, color: 'var(--accent)' },
        { label: 'Total Auction Value', value: '₹' + s.totalAuctionValue.toLocaleString(), color: 'var(--success)' },
        { label: 'Auction State', value: s.auctionState, color: s.auctionState === 'LIVE' ? 'var(--danger)' : 'var(--text-muted)' }
      ];
    });
  }

  getStatusDesc(state?: string): string {
    const map: any = {
      'NOT_STARTED': 'Auction has not started yet. Select a player to begin.',
      'READY': 'Player selected. Click Start Auction to begin bidding.',
      'LIVE': 'Auction is currently live! Bidding in progress.',
      'PAUSED': 'Auction is paused. Resume when ready.',
      'SOLD': 'Player sold! Select next player to continue.',
      'UNSOLD': 'Player unsold. Select next player to continue.',
      'COMPLETED': 'Auction completed.'
    };
    return map[state || 'NOT_STARTED'] || '';
  }
}
