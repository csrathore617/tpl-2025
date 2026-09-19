import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-player-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width:800px;padding:2rem 1.5rem">
      <div class="page-header">
        <h1 class="page-title">🏏 Player Registration</h1>
        <p class="page-subtitle">Register for TPL2026 T10 Cricket League</p>
      </div>

      <div *ngIf="success" class="success-banner">
        <div style="font-size:3rem">🎉</div>
        <h2>Registration Successful!</h2>
        <p>Your Player ID: <strong class="text-primary">{{ playerId }}</strong></p>
        <p style="color:var(--text-muted);margin-top:8px">Keep this ID safe. You'll need it for auction and team assignment.</p>
        <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center">
          <a routerLink="/players" class="btn btn-primary">View Players</a>
          <button class="btn btn-secondary" (click)="success=false;playerId=''">Register Another</button>
        </div>
      </div>

      <form *ngIf="!success" (ngSubmit)="submit()" #f="ngForm">
        <div class="card" style="margin-bottom:1.5rem">
          <h3 style="margin-bottom:1.5rem;color:var(--primary)">Basic Information</h3>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-control" [(ngModel)]="form.name" name="name" required placeholder="Enter full name">
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input class="form-control" type="date" [(ngModel)]="form.dob" name="dob">
            </div>
            <div class="form-group">
              <label class="form-label">Mobile Number *</label>
              <input class="form-control" [(ngModel)]="form.mobile" name="mobile" required placeholder="10-digit mobile" maxlength="10">
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input class="form-control" type="email" [(ngModel)]="form.email" name="email" required placeholder="email@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">City</label>
              <input class="form-control" [(ngModel)]="form.city" name="city" placeholder="Your city">
            </div>
            <div class="form-group">
              <label class="form-label">Jersey Number</label>
              <input class="form-control" type="number" [(ngModel)]="form.jersey_number" name="jersey_number" placeholder="Preferred jersey #">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Address</label>
              <input class="form-control" [(ngModel)]="form.address" name="address" placeholder="Full address">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Emergency Contact</label>
              <input class="form-control" [(ngModel)]="form.emergency_contact" name="emergency_contact" placeholder="Emergency contact number">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Profile Photo</label>
              <input class="form-control" type="file" accept="image/*" (change)="onFile($event)">
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom:1.5rem">
          <h3 style="margin-bottom:1.5rem;color:var(--primary)">Cricket Information</h3>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Playing Role *</label>
              <select class="form-control" [(ngModel)]="form.role" name="role" required>
                <option value="">Select role</option>
                <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicket Keeper</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Batting Style</label>
              <select class="form-control" [(ngModel)]="form.batting_style" name="batting_style">
                <option value="">Select</option>
                <option>Right Hand</option><option>Left Hand</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bowling Style</label>
              <select class="form-control" [(ngModel)]="form.bowling_style" name="bowling_style">
                <option value="">Select</option>
                <option>Right Arm Fast</option><option>Right Arm Medium</option><option>Right Arm Spin</option>
                <option>Left Arm Fast</option><option>Left Arm Medium</option><option>Left Arm Spin</option>
                <option>None</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Preferred Position</label>
              <input class="form-control" [(ngModel)]="form.preferred_position" name="preferred_position" placeholder="e.g. Opener, Middle Order">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Previous Cricket Experience</label>
              <textarea class="form-control" [(ngModel)]="form.experience" name="experience" rows="3" placeholder="Describe your cricket experience..."></textarea>
            </div>
          </div>
        </div>

        <div *ngIf="error" class="error-msg">❌ {{ error }}</div>

        <div style="display:flex;gap:1rem">
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading || !f.valid">
            {{ loading ? 'Registering...' : '🏏 Register Now' }}
          </button>
          <a routerLink="/players" class="btn btn-secondary btn-lg">Cancel</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .success-banner { text-align: center; padding: 3rem; background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(30,58,95,0.2)); border: 2px solid var(--success); border-radius: var(--radius); }
    .error-msg { background: rgba(239,68,68,0.1); border: 1px solid var(--danger); color: #fca5a5; padding: 10px 16px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    textarea.form-control { resize: vertical; }
  `]
})
export class PlayerRegisterComponent {
  form: any = { name:'', dob:'', mobile:'', email:'', city:'', address:'', role:'', batting_style:'', bowling_style:'', experience:'', preferred_position:'', jersey_number:'', emergency_contact:'' };
  photo: File | null = null;
  loading = false;
  error = '';
  success = false;
  playerId = '';

  constructor(private api: ApiService, private toast: ToastService) {}

  onFile(e: any) { this.photo = e.target.files[0] || null; }

  submit() {
    this.error = '';
    this.loading = true;
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => fd.append(k, String(v)));
    if (this.photo) fd.append('photo', this.photo);
    this.api.registerPlayer(fd).subscribe({
      next: (res) => { this.loading = false; this.success = true; this.playerId = res.player_id; this.toast.success('Registration successful!'); },
      error: (err) => { this.loading = false; this.error = err.error?.error || 'Registration failed'; }
    });
  }
}
