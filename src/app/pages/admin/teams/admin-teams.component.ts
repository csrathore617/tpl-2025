import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { Team } from '../../../types/models';

@Component({
  selector: 'app-admin-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div>
          <h1>Team Management</h1>
          <p style="color:var(--text-muted)">{{ teams.length }}/5 teams registered</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()" [disabled]="teams.length >= 5">
          {{ teams.length >= 5 ? '🔒 Max Teams Reached' : '+ Add Team' }}
        </button>
      </div>

      <div *ngIf="teams.length >= 5" style="background:rgba(59,130,246,0.1);border:1px solid var(--info);color:#93c5fd;padding:12px 20px;border-radius:8px;margin-bottom:1.5rem">
        🔒 Team Registration Closed – Maximum 5 teams reached
      </div>

      <div class="grid grid-3">
        <div class="team-card" *ngFor="let t of teams" [style.border-top]="'4px solid ' + (t.team_color || '#f97316')">
          <div class="team-card-header">
            <div *ngIf="t.logo; else noLogo">
              <img [src]="api.getImageUrl(t.logo)" class="team-logo">
            </div>
            <ng-template #noLogo>
              <div class="team-logo-placeholder" [style.background]="t.team_color || '#1a73e8'">{{ t.short_name || t.team_name.charAt(0) }}</div>
            </ng-template>
            <div>
              <h3>{{ t.team_name }}</h3>
              <div style="color:var(--text-muted);font-size:0.8rem">{{ t.team_id }}</div>
              <span class="badge badge-{{ t.status.toLowerCase() }}">{{ t.status }}</span>
            </div>
          </div>
          <div style="padding:0 1.5rem 1.5rem">
            <div class="team-stat-row"><span>Owner</span><span>{{ t.owner_name }}</span></div>
            <div class="team-stat-row"><span>Players</span><span class="text-primary">{{ t.players_count || 0 }}</span></div>
            <div class="team-stat-row"><span>Purse</span><span class="text-accent">₹{{ t.remaining_purse | number }}</span></div>
            <div style="margin-top:1rem;display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" style="flex:1" (click)="openEdit(t)">Edit</button>
              <button class="btn btn-warning btn-sm" style="flex:1" (click)="toggleStatus(t)">
                {{ t.status === 'INACTIVE' ? 'Activate' : 'Deactivate' }}
              </button>
            </div>
          </div>
        </div>
        <div *ngIf="teams.length === 0" class="empty-state" style="grid-column:1/-1">
          <div class="icon">🏆</div><h3>No teams yet</h3>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
      <div class="modal" style="max-width:600px;width:100%;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ editingId ? 'Edit Team' : 'Add Team' }}</h2>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Team Name *</label>
            <input class="form-control" [(ngModel)]="form.team_name" placeholder="e.g. Team Tigers">
          </div>
          <div class="form-group">
            <label class="form-label">Short Name</label>
            <input class="form-control" [(ngModel)]="form.short_name" placeholder="e.g. TIG" maxlength="4">
          </div>
          <div class="form-group">
            <label class="form-label">Owner Name *</label>
            <input class="form-control" [(ngModel)]="form.owner_name" placeholder="Owner full name">
          </div>
          <div class="form-group">
            <label class="form-label">Owner Contact (used as password)</label>
            <input class="form-control" [(ngModel)]="form.owner_contact" placeholder="Mobile number">
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input class="form-control" [(ngModel)]="form.city" placeholder="City">
          </div>
          <div class="form-group">
            <label class="form-label">Team Color</label>
            <input class="form-control" type="color" [(ngModel)]="form.team_color" style="height:42px;padding:4px">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="form.status">
              <option>REGISTERED</option><option>ACTIVE</option><option>INACTIVE</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Team Logo</label>
            <input class="form-control" type="file" accept="image/*" (change)="onFile($event)">
          </div>
        </div>
        <div *ngIf="formError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ formError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
          <button class="btn btn-primary" (click)="saveTeam()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.team-stat-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(55,65,81,0.3);font-size:0.85rem;color:var(--text-muted)} .team-stat-row span:last-child{color:var(--text);font-weight:500}`]
})
export class AdminTeamsComponent implements OnInit {
  teams: Team[] = [];
  showForm = false; editingId = '';
  form: any = {}; photo: File | null = null;
  saving = false; formError = '';

  constructor(public api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getTeams().subscribe(t => this.teams = t); }
  onFile(e: any) { this.photo = e.target.files[0] || null; }

  openAdd() {
    this.editingId = ''; this.formError = '';
    this.form = { team_name:'', short_name:'', owner_name:'', owner_contact:'', city:'', team_color:'#1a73e8', status:'REGISTERED' };
    this.photo = null; this.showForm = true;
  }

  openEdit(t: Team) {
    this.editingId = t.team_id; this.formError = '';
    this.form = { ...t }; this.photo = null; this.showForm = true;
  }

  saveTeam() {
    if (!this.form.team_name || !this.form.owner_name) { this.formError = 'Team name and owner name required'; return; }
    this.saving = true; this.formError = '';
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => fd.append(k, String(v ?? '')));
    if (this.photo) fd.append('logo', this.photo);
    const obs = this.editingId ? this.api.updateTeam(this.editingId, fd) : this.api.createTeam(fd);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.toast.success('Team saved!'); this.load(); },
      error: (err) => { this.saving = false; this.formError = err.error?.error || 'Save failed'; }
    });
  }

  toggleStatus(t: Team) {
    const newStatus = t.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const fd = new FormData(); fd.append('status', newStatus);
    this.api.updateTeam(t.team_id, fd).subscribe({
      next: () => { this.toast.success('Status updated'); this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }
}
