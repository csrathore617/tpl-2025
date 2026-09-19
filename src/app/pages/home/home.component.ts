import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { Stats, Announcement } from '../../types/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <!-- Ticker -->
    <div class="ticker-wrap" *ngIf="announcements.length">
      <div class="ticker-content">
        <span *ngFor="let a of announcements.concat(announcements)" class="ticker-item">
          {{ a.message }} &nbsp;&nbsp;|&nbsp;&nbsp;
        </span>
      </div>
    </div>

    <!-- Hero -->
    <section class="hero-section">
      <div class="container hero-content">
        <div class="hero-badge">
          <span class="live-dot" *ngIf="stats?.auctionState === 'LIVE'"></span>
          <span *ngIf="stats?.auctionState === 'LIVE'">🔴 LIVE AUCTION</span>
          <span *ngIf="stats?.auctionState !== 'LIVE'">🟡 AUCTION COMING SOON</span>
        </div>
        <h1 class="hero-title">TPL<span class="text-primary">2026</span></h1>
        <h2 class="hero-subtitle">T10 Cricket League</h2>
        <p class="hero-tagline">"Where Every Ball Counts."</p>
        <div class="hero-date">
          <span class="date-badge">📅 Tournament Date: <strong>To Be Announced Soon</strong></span>
          <span class="date-expected">Expected: 1st Week of November 2026</span>
        </div>
        <div class="hero-buttons">
          <a routerLink="/players/register" class="btn btn-primary btn-xl">🏏 Register as Player</a>
          <a routerLink="/players" class="btn btn-secondary btn-xl">View Players</a>
          <a routerLink="/teams" class="btn btn-secondary btn-xl">View Teams</a>
          <a routerLink="/auction" class="btn btn-secondary btn-xl">Live Auction</a>
          <a routerLink="/rules" class="btn btn-secondary btn-xl">Tournament Rules</a>
        </div>
      </div>
      <div class="hero-cricket">🏏</div>
    </section>

    <!-- Stats -->
    <section class="section" style="background:var(--bg-card);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
      <div class="container">
        <div class="grid grid-4" *ngIf="stats; else statsLoading">
          <div class="stat-card">
            <div class="stat-value text-primary">{{ stats.totalPlayers }}</div>
            <div class="stat-label">Registered Players</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-success">{{ stats.totalTeams }}</div>
            <div class="stat-label">Registered Teams</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-accent">{{ stats.soldPlayers }}</div>
            <div class="stat-label">Players Sold</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--info)">₹{{ stats.totalAuctionValue | number }}</div>
            <div class="stat-label">Total Auction Value</div>
          </div>
        </div>
        <ng-template #statsLoading>
          <div class="grid grid-4">
            <div class="stat-card skeleton" style="height:100px" *ngFor="let i of [1,2,3,4]"></div>
          </div>
        </ng-template>
      </div>
    </section>

    <!-- Features -->
    <section class="section">
      <div class="container">
        <h2 class="section-title text-center gradient-text">Tournament Highlights</h2>
        <p class="section-subtitle text-center">Everything you need for the ultimate T10 experience</p>
        <div class="grid grid-3">
          <div class="card feature-card" *ngFor="let f of features">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta-section">
      <div class="container text-center">
        <h2 style="font-size:2.5rem;margin-bottom:1rem">Ready to Play?</h2>
        <p style="color:var(--text-muted);margin-bottom:2rem;font-size:1.1rem">Register now and be part of TPL2026 T10 Cricket League</p>
        <a routerLink="/players/register" class="btn btn-primary btn-xl">Register as Player</a>
      </div>
    </section>
  `,
  styles: [`
    .ticker-item { font-size: 0.88rem; color: var(--text); }
    .hero-content { position: relative; z-index: 1; padding: 4rem 0; }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; color: var(--primary); }
    .hero-title { font-size: clamp(4rem,10vw,8rem); font-weight: 900; line-height: 1; margin-bottom: 0.5rem; }
    .hero-subtitle { font-size: clamp(1.5rem,4vw,2.5rem); color: var(--text-muted); margin-bottom: 1rem; }
    .hero-tagline { font-size: 1.2rem; color: var(--accent); font-style: italic; margin-bottom: 2rem; }
    .hero-date { display: flex; flex-direction: column; gap: 6px; margin-bottom: 2.5rem; }
    .date-badge { background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; display: inline-block; font-size: 0.9rem; }
    .date-expected { color: var(--text-muted); font-size: 0.85rem; }
    .hero-buttons { display: flex; flex-wrap: wrap; gap: 1rem; }
    .hero-cricket { position: absolute; right: 5%; top: 50%; transform: translateY(-50%); font-size: 15rem; opacity: 0.05; pointer-events: none; }
    .feature-card { text-align: center; transition: transform 0.2s; }
    .feature-card:hover { transform: translateY(-4px); }
    .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .feature-card h3 { margin-bottom: 0.5rem; font-size: 1.2rem; }
    .feature-card p { color: var(--text-muted); font-size: 0.88rem; }
    .cta-section { background: linear-gradient(135deg, rgba(249,115,22,0.1), rgba(30,58,95,0.3)); border-top: 1px solid var(--border); }
    .text-center { text-align: center; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  stats: Stats | null = null;
  announcements: Announcement[] = [];
  private sub?: Subscription;

  features = [
    { icon: '🏏', title: 'T10 Format', desc: '10 overs per innings – fast, exciting, action-packed cricket.' },
    { icon: '💰', title: 'Live Auction', desc: '₹21,000 purse per team. Real-time bidding for the best players.' },
    { icon: '🎲', title: 'Random Selection', desc: 'Exciting random player selection keeps the auction unpredictable.' },
    { icon: '📊', title: 'Live Updates', desc: 'Real-time scores, bids, and announcements via WebSocket.' },
    { icon: '🏆', title: '5 Teams', desc: 'Maximum 5 teams compete for the TPL2026 championship.' },
    { icon: '📱', title: 'Fully Responsive', desc: 'Watch the auction live from any device, anywhere.' }
  ];

  constructor(private api: ApiService, private socket: SocketService) {}

  ngOnInit() {
    this.loadData();
    this.sub = this.socket.events$.subscribe(({ event }) => {
      if (['PLAYER_SOLD','PLAYER_UNSOLD','TEAM_PURSE_UPDATED','ANNOUNCEMENT_UPDATED'].includes(event)) {
        this.loadData();
      }
    });
  }

  loadData() {
    this.api.getStats().subscribe(s => this.stats = s);
    this.api.getAnnouncements().subscribe(a => this.announcements = a);
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
