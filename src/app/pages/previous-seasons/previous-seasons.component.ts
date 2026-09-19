import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Season, GalleryItem } from '../../types/models';

@Component({
  selector: 'app-previous-seasons',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container" style="padding:2rem 1.5rem">
      <div class="page-header">
        <h1 class="page-title">🏆 A Legacy of Champions</h1>
        <p class="page-subtitle">Celebrating the teams and players who made TPL history</p>
      </div>

      <!-- Timeline -->
      <div class="timeline" *ngIf="!loading && seasons.length">
        <div class="timeline-track">
          <div class="timeline-node" *ngFor="let s of seasons; let i = index">
            <div class="timeline-dot" [class.active]="i === seasons.length - 1">{{ s.season_number }}</div>
            <div class="timeline-label">{{ s.year || 'Season ' + s.season_number }}</div>
          </div>
          <div class="timeline-node next">
            <div class="timeline-dot next-dot">🏏</div>
            <div class="timeline-label">TPL2026</div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="grid grid-3">
        <div class="card skeleton" style="height:320px" *ngFor="let i of [1,2,3]"></div>
      </div>

      <div *ngIf="!loading && seasons.length === 0" class="empty-state">
        <div class="icon">🏆</div>
        <h3>No previous seasons yet</h3>
        <p>Season history will appear here once added by admin</p>
      </div>

      <div class="grid grid-3" *ngIf="!loading && seasons.length">
        <div class="season-card" *ngFor="let s of seasons">
          <div class="season-card-header">
            <div class="season-badge">Season {{ s.season_number }}</div>
            <div *ngIf="s.year" class="season-year">{{ s.year }}</div>
          </div>
          <div class="season-trophy">🏆</div>
          <div *ngIf="s.champion_image || s.champion_logo" style="margin:1rem 0">
            <img [src]="getImg(s.champion_image || s.champion_logo)" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--accent);margin:0 auto;display:block" [alt]="s.champion_team">
          </div>
          <h2 class="champion-name">{{ s.champion_team }}</h2>
          <div class="champion-badge">🏆 CHAMPIONS</div>
          <p class="season-desc" *ngIf="s.final_description">"{{ s.final_description }}"</p>
          <div class="season-details">
            <div class="detail-row" *ngIf="s.captain"><span>👑 Captain</span><span>{{ s.captain }}</span></div>
            <div class="detail-row" *ngIf="s.man_of_series"><span>⭐ Man of Series</span><span>{{ s.man_of_series }}</span></div>
            <div class="detail-row" *ngIf="s.runner_up"><span>🥈 Runner-up</span><span>{{ s.runner_up }}</span></div>
            <div class="detail-row" *ngIf="s.venue"><span>🏟️ Venue</span><span>{{ s.venue }}</span></div>
            <div class="detail-row" *ngIf="s.final_score"><span>📊 Score</span><span>{{ s.final_score }}</span></div>
          </div>
          <a [routerLink]="['/gallery']" [queryParams]="{season: s.season_id}" class="btn btn-secondary btn-sm" style="width:100%;justify-content:center;margin-top:1rem">
            📸 View Season Gallery
          </a>
        </div>
      </div>

      <!-- Current Season CTA -->
      <div class="cta-section" style="margin-top:3rem">
        <div class="card" style="text-align:center;background:linear-gradient(135deg,rgba(249,115,22,0.1),rgba(30,58,95,0.3));border-color:var(--primary)">
          <div style="font-size:3rem;margin-bottom:1rem">🏏</div>
          <h2 style="font-size:2rem;margin-bottom:0.5rem">TPL<span class="text-primary">2026</span></h2>
          <p style="color:var(--text-muted);margin-bottom:0.5rem">The next chapter begins...</p>
          <p style="color:var(--accent);font-weight:600;margin-bottom:1.5rem">Tournament Date: Coming Soon · Expected 1st Week of November 2026</p>
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
            <a routerLink="/players/register" class="btn btn-primary">Join TPL2026</a>
            <a routerLink="/auction" class="btn btn-secondary">View Live Auction</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline { margin: 2rem 0; overflow-x: auto; padding-bottom: 1rem; }
    .timeline-track { display: flex; align-items: flex-start; gap: 0; min-width: max-content; }
    .timeline-node { display: flex; flex-direction: column; align-items: center; position: relative; }
    .timeline-node:not(:last-child)::after { content: '→'; position: absolute; right: -16px; top: 12px; color: var(--primary); font-size: 1.2rem; z-index: 1; }
    .timeline-node { padding: 0 2rem; }
    .timeline-dot { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
    .timeline-dot.active { background: var(--primary); border-color: var(--primary); color: white; }
    .timeline-dot.next-dot { background: linear-gradient(135deg, var(--primary), var(--accent)); border-color: var(--accent); font-size: 1.2rem; }
    .timeline-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; text-align: center; }
    .season-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
    .season-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(249,115,22,0.2); border-color: var(--primary); }
    .season-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .season-badge { background: rgba(249,115,22,0.2); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
    .season-year { color: var(--text-muted); font-size: 0.85rem; }
    .season-trophy { font-size: 3rem; margin: 0.5rem 0; }
    .champion-name { font-size: 1.4rem; color: var(--accent); margin: 0.5rem 0; }
    .champion-badge { background: rgba(251,191,36,0.15); color: var(--accent); padding: 4px 16px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; display: inline-block; margin-bottom: 1rem; }
    .season-desc { color: var(--text-muted); font-style: italic; font-size: 0.88rem; margin-bottom: 1rem; line-height: 1.5; }
    .season-details { text-align: left; }
    .detail-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(55,65,81,0.3); font-size: 0.82rem; }
    .detail-row span:first-child { color: var(--text-muted); }
    .detail-row span:last-child { font-weight: 600; color: var(--text); }
  `]
})
export class PreviousSeasonsComponent implements OnInit {
  seasons: Season[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSeasons().subscribe({
      next: s => { this.seasons = s; this.loading = false; },
      error: () => this.loading = false
    });
  }

  getImg(path: string): string { return this.api.getImageUrl(path); }
}
