import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <div><h1>Sessions</h1><p style="color:var(--text-muted)">Manage tournament sessions</p></div>
        <button class="btn btn-primary" (click)="openAdd()">+ Add Session</button>
      </div>

      <div class="grid grid-2">
        <div class="card" *ngFor="let s of sessions" style="border-left:4px solid var(--primary)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
            <h3 style="font-size:1.05rem">{{ s.name }}</h3>
            <span class="badge" [class]="getStatusClass(s.status)">{{ s.status || 'UPCOMING' }}</span>
          </div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.5rem">
            <span *ngIf="s.date">📅 {{ s.date }}</span>
            <span *ngIf="s.time" style="margin-left:1rem">🕐 {{ s.time }}</span>
          </div>
          <p style="font-size:0.85rem;color:var(--text-muted)" *ngIf="s.description">{{ s.description }}</p>
          <div style="display:flex;gap:8px;margin-top:1rem">
            <button class="btn btn-secondary btn-sm" (click)="openEdit(s)">Edit</button>
            <button class="btn btn-danger btn-sm" (click)="confirmDel(s)">Delete</button>
          </div>
        </div>
        <div *ngIf="sessions.length === 0" class="empty-state" style="grid-column:1/-1">
          <div class="icon">📅</div><h3>No sessions yet</h3>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ editingId ? 'Edit Session' : 'Add Session' }}</h2>
        <div class="form-group">
          <label class="form-label">Session Name *</label>
          <input class="form-control" [(ngModel)]="form.name" placeholder="e.g. Opening Match">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-control" type="date" [(ngModel)]="form.date">
          </div>
          <div class="form-group">
            <label class="form-label">Time</label>
            <input class="form-control" type="time" [(ngModel)]="form.time">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" [(ngModel)]="form.status">
            <option>UPCOMING</option><option>LIVE</option><option>COMPLETED</option><option>CANCELLED</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" [(ngModel)]="form.description" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Important Notes</label>
          <input class="form-control" [(ngModel)]="form.notes" placeholder="Any important notes...">
        </div>
        <div *ngIf="formError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ formError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <app-confirm-modal [visible]="showDel" title="Delete Session"
      [message]="'Delete session: ' + (delTarget?.name || '') + '?'"
      confirmText="Delete" confirmClass="danger"
      (confirmed)="doDelete()" (cancelled)="showDel=false">
    </app-confirm-modal>
  `
})
export class AdminSessionsComponent implements OnInit {
  sessions: any[] = [];
  showForm = false; editingId = '';
  form: any = {}; saving = false; formError = '';
  showDel = false; delTarget: any = null;

  constructor(private api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getSessions().subscribe(s => this.sessions = s.filter((x: any) => x.name !== '__DELETED__')); }

  openAdd() {
    this.editingId = '';
    this.form = { name: '', date: '', time: '', status: 'UPCOMING', description: '', notes: '' };
    this.formError = ''; this.showForm = true;
  }
  openEdit(s: any) { this.editingId = s.id; this.form = { ...s }; this.formError = ''; this.showForm = true; }

  save() {
    if (!this.form.name) { this.formError = 'Session name required'; return; }
    this.saving = true; this.formError = '';
    const obs = this.editingId ? this.api.updateSession(this.editingId, this.form) : this.api.createSession(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.toast.success('Session saved!'); this.load(); },
      error: (err) => { this.saving = false; this.formError = err.error?.error || 'Save failed'; }
    });
  }

  confirmDel(s: any) { this.delTarget = s; this.showDel = true; }
  doDelete() {
    if (!this.delTarget) return;
    this.api.deleteSession(this.delTarget.id).subscribe({
      next: () => { this.toast.success('Deleted'); this.showDel = false; this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }

  getStatusClass(status: string): string {
    const map: any = { 'LIVE': 'badge-live', 'UPCOMING': 'badge-registered', 'COMPLETED': 'badge-verified', 'CANCELLED': 'badge-withdrawn' };
    return map[status?.toUpperCase()] || 'badge-registered';
  }
}
