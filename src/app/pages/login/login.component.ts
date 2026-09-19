import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div style="text-align:center;margin-bottom:2rem">
          <div style="font-size:3rem">🏏</div>
          <h1 style="font-size:2rem;color:var(--primary)">TPL2026</h1>
          <p style="color:var(--text-muted)">Sign in to continue</p>
        </div>

        <div class="tab-bar">
          <button class="tab-btn" [class.active]="tab==='admin'" (click)="tab='admin'">Admin Login</button>
          <button class="tab-btn" [class.active]="tab==='team'" (click)="tab='team'">Team Owner Login</button>
        </div>

        <form (ngSubmit)="submit()" style="margin-top:1.5rem">
          <ng-container *ngIf="tab==='admin'">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input class="form-control" [(ngModel)]="username" name="username" placeholder="admin" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-control" type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
            </div>
          </ng-container>
          <ng-container *ngIf="tab==='team'">
            <div class="form-group">
              <label class="form-label">Team ID</label>
              <input class="form-control" [(ngModel)]="teamId" name="teamId" placeholder="TPL26-T01" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password (Owner Contact)</label>
              <input class="form-control" type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
            </div>
          </ng-container>

          <div *ngIf="error" class="error-msg">❌ {{ error }}</div>

          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div style="margin-top:1.5rem;padding:1rem;background:var(--bg-card2);border-radius:8px;font-size:0.8rem;color:var(--text-muted)">
          <strong>Demo credentials:</strong><br>
          Admin: admin / tpl2026admin
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: radial-gradient(ellipse at top, #1a2744 0%, var(--bg-dark) 60%); }
    .login-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 2.5rem; width: 100%; max-width: 420px; }
    .tab-bar { display: flex; background: var(--bg-card2); border-radius: 8px; padding: 4px; gap: 4px; }
    .tab-btn { flex: 1; padding: 8px; border: none; background: none; color: var(--text-muted); border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
    .tab-btn.active { background: var(--primary); color: white; }
    .error-msg { background: rgba(239,68,68,0.1); border: 1px solid var(--danger); color: #fca5a5; padding: 10px 16px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.88rem; }
  `]
})
export class LoginComponent {
  tab = 'admin';
  username = '';
  password = '';
  teamId = '';
  loading = false;
  error = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private toast: ToastService) {}

  submit() {
    this.error = '';
    this.loading = true;
    if (this.tab === 'admin') {
      this.api.adminLogin(this.username, this.password).subscribe({
        next: (res) => { this.auth.login(res); this.toast.success('Welcome, Admin!'); this.router.navigate(['/admin']); },
        error: (err) => { this.loading = false; this.error = err.error?.error || 'Login failed'; }
      });
    } else {
      this.api.teamLogin(this.teamId, this.password).subscribe({
        next: (res) => { this.auth.login(res); this.toast.success(`Welcome, ${res.teamName}!`); this.router.navigate(['/auction']); },
        error: (err) => { this.loading = false; this.error = err.error?.error || 'Login failed'; }
      });
    }
  }
}
