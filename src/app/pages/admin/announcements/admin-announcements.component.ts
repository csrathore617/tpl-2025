import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { Announcement } from '../../../types/models';

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div><h1>Announcements</h1><p style="color:var(--text-muted)">Manage ticker announcements</p></div>
        <button class="btn btn-primary" (click)="openAdd()">+ Add Announcement</button>
      </div>

      <div class="table-wrap card" style="padding:0">
        <table>
          <thead><tr><th>Message</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of announcements">
              <td style="max-width:400px">{{ a.message }}</td>
              <td>{{ a.priority }}</td>
              <td>
                <span class="badge" [class]="a.active === 'true' || a.active === true ? 'badge-active' : 'badge-inactive'">
                  {{ a.active === 'true' || a.active === true ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="color:var(--text-muted);font-size:0.8rem">{{ a.created_at | date:'short' }}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-secondary btn-sm" (click)="openEdit(a)">Edit</button>
                  <button class="btn btn-warning btn-sm" (click)="toggleActive(a)">
                    {{ a.active === 'true' || a.active === true ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="confirmDel(a)">Delete</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="announcements.length === 0">
              <td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No announcements</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ editingId ? 'Edit' : 'Add' }} Announcement</h2>
        <div class="form-group">
          <label class="form-label">Message *</label>
          <textarea class="form-control" [(ngModel)]="form.message" rows="3" placeholder="Announcement message..."></textarea>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Priority (1=highest)</label>
            <input class="form-control" type="number" [(ngModel)]="form.priority" min="1" max="10">
          </div>
          <div class="form-group">
            <label class="form-label">Active</label>
            <select class="form-control" [(ngModel)]="form.active">
              <option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div *ngIf="formError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ formError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <app-confirm-modal [visible]="showDel" title="Delete Announcement" message="Delete this announcement?"
      confirmText="Delete" confirmClass="danger" (confirmed)="doDelete()" (cancelled)="showDel=false">
    </app-confirm-modal>
  `
})
export class AdminAnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  showForm = false; editingId = '';
  form: any = { message: '', priority: 1, active: 'true' };
  saving = false; formError = '';
  showDel = false; delTarget: Announcement | null = null;

  constructor(private api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getAdminAnnouncements().subscribe(a => this.announcements = a); }

  openAdd() { this.editingId = ''; this.form = { message: '', priority: 1, active: 'true' }; this.formError = ''; this.showForm = true; }
  openEdit(a: Announcement) { this.editingId = a.announcement_id; this.form = { message: a.message, priority: a.priority, active: String(a.active) }; this.formError = ''; this.showForm = true; }

  save() {
    if (!this.form.message) { this.formError = 'Message required'; return; }
    this.saving = true; this.formError = '';
    const obs = this.editingId ? this.api.updateAnnouncement(this.editingId, this.form) : this.api.createAnnouncement(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.toast.success('Saved!'); this.load(); },
      error: (err) => { this.saving = false; this.formError = err.error?.error || 'Failed'; }
    });
  }

  toggleActive(a: Announcement) {
    const active = !(a.active === 'true' || a.active === true);
    this.api.updateAnnouncement(a.announcement_id, { ...a, active: String(active) }).subscribe({
      next: () => { this.toast.success('Updated'); this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }

  confirmDel(a: Announcement) { this.delTarget = a; this.showDel = true; }
  doDelete() {
    if (!this.delTarget) return;
    this.api.deleteAnnouncement(this.delTarget.announcement_id).subscribe({
      next: () => { this.toast.success('Deleted'); this.showDel = false; this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }
}
