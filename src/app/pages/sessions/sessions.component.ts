import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding:2rem 1.5rem">
      <div class="page-header">
        <h1 class="page-title">📅 Sessions</h1>
        <p class="page-subtitle">Tournament schedule and session information</p>
      </div>

      <div *ngIf="loading" class="grid grid-2">
        <div class="card skeleton" style="height:160px" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <div *ngIf="!loading && sessions.length === 0" class="empty-state">
        <div class="icon">📅</div>
        <h3>No sessions scheduled yet</h3>
        <p>Session information will appear here once added by admin</p>
      </div>

      <div class="grid grid-2" *ngIf="!loading && sessions.length">
        <div class="session-card" *ngFor="let s of sessions" [class]="'session-' + (s.status || 'upcoming').toLowerCase()">
          <div class="session-header">
            <div>
              <h3 class="session-name">{{ s.name }}</h3>
              <div class="session-meta">
                <span *ngIf="s.date">📅 {{ s.date }}</span>
                <span *ngIf="s.time">🕐 {{ s.time }}</span>
              </div>
            </div>
            <span class="badge" [class]="getStatusClass(s.status)">{{ s.status || 'UPCOMING' }}</span>
          </div>
          <p class="session-desc" *ngIf="s.description">{{ s.description }}</p>
          <div class="session-notes" *ngIf="s.notes">
            <span style="color:var(--warning)">⚠️</span> {{ s.notes }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; border-left: 4px solid var(--border); transition: transform 0.2s; }
    .session-card:hover { transform: translateY(-2px); }
    .session-live { border-left-color: var(--danger); }
    .session-upcoming { border-left-color: var(--info); }
    .session-completed { border-left-color: var(--success); }
    .session-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 1rem; }
    .session-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
    .session-meta { display: flex; gap: 1rem; font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap; }
    .session-desc { color: var(--text-muted); font-size: 0.88rem; margin-bottom: 0.5rem; }
    .session-notes { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.82rem; color: var(--warning); }
  `]
})
export class SessionsComponent implements OnInit {
  sessions: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSessions().subscribe({
      next: s => { this.sessions = s.filter((x: any) => x.name !== '__DELETED__'); this.loading = false; },
      error: () => this.loading = false
    });
  }

  getStatusClass(status: string): string {
    const map: any = { 'LIVE': 'badge-live', 'UPCOMING': 'badge-registered', 'COMPLETED': 'badge-verified', 'CANCELLED': 'badge-withdrawn' };
    return map[status?.toUpperCase()] || 'badge-registered';
  }
}
