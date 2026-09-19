import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { Player } from '../../../types/models';

@Component({
  selector: 'app-admin-players',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div>
          <h1>Player Management</h1>
          <p style="color:var(--text-muted)">{{ players.length }} total players</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">+ Add Player</button>
      </div>

      <div class="filter-bar">
        <input class="form-control search-input" placeholder="🔍 Search..." [(ngModel)]="search" (ngModelChange)="applyFilters()">
        <select class="form-control" style="width:auto" [(ngModel)]="filterRole" (ngModelChange)="applyFilters()">
          <option value="">All Roles</option>
          <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicket Keeper</option>
        </select>
        <select class="form-control" style="width:auto" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
          <option value="">All Status</option>
          <option>REGISTERED</option><option>VERIFIED</option><option>AVAILABLE</option>
          <option>SOLD</option><option>UNSOLD</option><option>WITHDRAWN</option>
        </select>
      </div>

      <div class="table-wrap card" style="padding:0">
        <table>
          <thead><tr>
            <th>Player</th><th>Role</th><th>City</th><th>Status</th><th>Team</th><th>Bid</th><th>Actions</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div *ngIf="p.photo; else noPhoto">
                    <img [src]="api.getImageUrl(p.photo)" class="avatar" style="width:36px;height:36px">
                  </div>
                  <ng-template #noPhoto>
                    <div class="avatar avatar-placeholder" style="width:36px;height:36px;font-size:0.9rem">{{ p.name.charAt(0) }}</div>
                  </ng-template>
                  <div>
                    <div style="font-weight:600">{{ p.name }}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">{{ p.player_id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ p.role }}</td>
              <td>{{ p.city || '—' }}</td>
              <td><span class="badge badge-{{ p.status.toLowerCase() }}">{{ p.status }}</span></td>
              <td>{{ p.team_id || '—' }}</td>
              <td>{{ p.final_bid ? '₹' + p.final_bid : '—' }}</td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-secondary btn-sm" (click)="openEdit(p)">Edit</button>
                  <select class="form-control" style="padding:4px 8px;font-size:0.78rem;width:auto" [(ngModel)]="p._newStatus" (change)="changeStatus(p)">
                    <option value="">Status</option>
                    <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                  </select>
                  <button class="btn btn-danger btn-sm" (click)="confirmDelete(p)">Delete</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No players found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
      <div class="modal" style="max-width:700px;width:100%;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ editingId ? 'Edit Player' : 'Add Player' }}</h2>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input class="form-control" [(ngModel)]="form.name" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <input class="form-control" type="date" [(ngModel)]="form.dob">
          </div>
          <div class="form-group">
            <label class="form-label">Mobile *</label>
            <input class="form-control" [(ngModel)]="form.mobile" placeholder="10-digit mobile">
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input class="form-control" [(ngModel)]="form.email" placeholder="email">
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input class="form-control" [(ngModel)]="form.city">
          </div>
          <div class="form-group">
            <label class="form-label">Role *</label>
            <select class="form-control" [(ngModel)]="form.role">
              <option value="">Select</option>
              <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicket Keeper</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Batting Style</label>
            <select class="form-control" [(ngModel)]="form.batting_style">
              <option value="">Select</option><option>Right Hand</option><option>Left Hand</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bowling Style</label>
            <select class="form-control" [(ngModel)]="form.bowling_style">
              <option value="">Select</option>
              <option>Right Arm Fast</option><option>Right Arm Medium</option><option>Right Arm Spin</option>
              <option>Left Arm Fast</option><option>Left Arm Medium</option><option>Left Arm Spin</option><option>None</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="form.status">
              <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Jersey Number</label>
            <input class="form-control" [(ngModel)]="form.jersey_number" type="number">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Experience</label>
            <textarea class="form-control" [(ngModel)]="form.experience" rows="2"></textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Photo</label>
            <input class="form-control" type="file" accept="image/*" (change)="onFile($event)">
          </div>
        </div>
        <div *ngIf="formError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ formError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
          <button class="btn btn-primary" (click)="savePlayer()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <app-confirm-modal
      [visible]="showDeleteConfirm"
      title="Delete Player"
      [message]="'Are you sure you want to delete ' + (deleteTarget?.name || '') + '?'"
      confirmText="Delete"
      confirmClass="danger"
      (confirmed)="doDelete()"
      (cancelled)="showDeleteConfirm=false">
    </app-confirm-modal>
  `
})
export class AdminPlayersComponent implements OnInit {
  players: (Player & { _newStatus: string })[] = [];
  filtered: (Player & { _newStatus: string })[] = [];
  search = ''; filterRole = ''; filterStatus = '';
  showForm = false; editingId = '';
  form: any = {};
  photo: File | null = null;
  saving = false; formError = '';
  showDeleteConfirm = false; deleteTarget: Player | null = null;
  statuses = ['REGISTERED','VERIFIED','AVAILABLE','SOLD','UNSOLD','RETAINED','WITHDRAWN'];

  constructor(public api: ApiService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getPlayers().subscribe(p => { this.players = p.map((x:any) => ({...x, _newStatus:''})); this.applyFilters(); });
  }

  applyFilters() {
    let r = [...this.players];
    if (this.search) r = r.filter(p => p.name.toLowerCase().includes(this.search.toLowerCase()) || p.player_id.includes(this.search));
    if (this.filterRole) r = r.filter(p => p.role === this.filterRole);
    if (this.filterStatus) r = r.filter(p => p.status === this.filterStatus);
    this.filtered = r;
  }

  openAdd() {
    this.editingId = '';
    this.form = { name:'', dob:'', mobile:'', email:'', city:'', role:'', batting_style:'', bowling_style:'', experience:'', jersey_number:'', status:'REGISTERED' };
    this.photo = null; this.formError = ''; this.showForm = true;
  }

  openEdit(p: Player) {
    this.editingId = p.player_id;
    this.form = { ...p };
    this.photo = null; this.formError = ''; this.showForm = true;
  }

  onFile(e: any) { this.photo = e.target.files[0] || null; }

  savePlayer() {
    if (!this.form.name || !this.form.role) { this.formError = 'Name and role are required'; return; }
    this.saving = true; this.formError = '';
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => { if (!k.startsWith('_')) fd.append(k, String(v ?? '')); });
    if (this.photo) fd.append('photo', this.photo);

    const obs = this.editingId ? this.api.updatePlayer(this.editingId, fd) : this.api.registerPlayer(fd);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.toast.success('Player saved!'); this.load(); },
      error: (err) => { this.saving = false; this.formError = err.error?.error || 'Save failed'; }
    });
  }

  changeStatus(p: any) {
    if (!p._newStatus) return;
    const fd = new FormData(); fd.append('status', p._newStatus);
    this.api.updatePlayer(p.player_id, fd).subscribe({
      next: () => { this.toast.success(`Status updated to ${p._newStatus}`); p.status = p._newStatus; p._newStatus = ''; },
      error: (err) => this.toast.error(err.error?.error || 'Update failed')
    });
  }

  confirmDelete(p: Player) { this.deleteTarget = p; this.showDeleteConfirm = true; }

  doDelete() {
    if (!this.deleteTarget) return;
    this.api.deletePlayer(this.deleteTarget.player_id).subscribe({
      next: () => { this.toast.success('Player deleted'); this.showDeleteConfirm = false; this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Delete failed')
    });
  }
}
