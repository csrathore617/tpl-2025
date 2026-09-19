import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { Season } from '../../../types/models';

@Component({
  selector: 'app-admin-seasons',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <div><h1>Previous Seasons</h1><p style="color:var(--text-muted)">{{ seasons.length }} seasons</p></div>
        <button class="btn btn-primary" (click)="openAdd()">+ Add Season</button>
      </div>

      <div class="grid grid-3">
        <div class="card" *ngFor="let s of seasons" style="position:relative">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
            <div>
              <div style="font-size:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase">Season {{ s.season_number }}</div>
              <h3 style="font-size:1.1rem">{{ s.season_name }}</h3>
              <div style="color:var(--text-muted);font-size:0.8rem">{{ s.year }}</div>
            </div>
            <span class="badge badge-{{ s.status.toLowerCase() }}">{{ s.status }}</span>
          </div>
          <div style="font-size:0.88rem;margin-bottom:0.5rem"><strong style="color:var(--accent)">🏆 {{ s.champion_team }}</strong></div>
          <div style="font-size:0.82rem;color:var(--text-muted)" *ngIf="s.captain">👑 {{ s.captain }}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)" *ngIf="s.man_of_series">⭐ {{ s.man_of_series }}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:8px;font-style:italic" *ngIf="s.final_description">"{{ s.final_description }}"</div>
          <div style="display:flex;gap:8px;margin-top:1rem">
            <button class="btn btn-secondary btn-sm" style="flex:1" (click)="openEdit(s)">Edit</button>
            <button class="btn btn-warning btn-sm" (click)="toggleStatus(s)">{{ s.status === 'INACTIVE' ? 'Activate' : 'Deactivate' }}</button>
            <button class="btn btn-danger btn-sm" (click)="confirmDel(s)">Delete</button>
          </div>
        </div>
        <div *ngIf="seasons.length === 0" class="empty-state" style="grid-column:1/-1">
          <div class="icon">🏆</div><h3>No seasons yet</h3>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
      <div class="modal" style="max-width:700px;width:100%;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ editingId ? 'Edit Season' : 'Add Season' }}</h2>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Season Number</label>
            <input class="form-control" type="number" [(ngModel)]="form.season_number">
          </div>
          <div class="form-group">
            <label class="form-label">Season Name *</label>
            <input class="form-control" [(ngModel)]="form.season_name" placeholder="e.g. TPL Season 4">
          </div>
          <div class="form-group">
            <label class="form-label">Year</label>
            <input class="form-control" [(ngModel)]="form.year" placeholder="e.g. 2026">
          </div>
          <div class="form-group">
            <label class="form-label">Champion Team *</label>
            <input class="form-control" [(ngModel)]="form.champion_team" placeholder="Winning team name">
          </div>
          <div class="form-group">
            <label class="form-label">Captain</label>
            <input class="form-control" [(ngModel)]="form.captain">
          </div>
          <div class="form-group">
            <label class="form-label">Man of the Series</label>
            <input class="form-control" [(ngModel)]="form.man_of_series">
          </div>
          <div class="form-group">
            <label class="form-label">Runner-up</label>
            <input class="form-control" [(ngModel)]="form.runner_up">
          </div>
          <div class="form-group">
            <label class="form-label">Final Score</label>
            <input class="form-control" [(ngModel)]="form.final_score">
          </div>
          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="form-control" [(ngModel)]="form.venue">
          </div>
          <div class="form-group">
            <label class="form-label">Display Order</label>
            <input class="form-control" type="number" [(ngModel)]="form.display_order">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="form.status">
              <option>ACTIVE</option><option>INACTIVE</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Final Description</label>
            <textarea class="form-control" [(ngModel)]="form.final_description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Champion Logo</label>
            <input class="form-control" type="file" accept="image/*" (change)="onFile($event,'logo')">
          </div>
          <div class="form-group">
            <label class="form-label">Champion Image</label>
            <input class="form-control" type="file" accept="image/*" (change)="onFile($event,'image')">
          </div>
        </div>
        <div *ngIf="formError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ formError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showForm=false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <app-confirm-modal [visible]="showDel" title="Delete Season" [message]="'Delete ' + (delTarget?.season_name || '') + '?'"
      confirmText="Delete" confirmClass="danger" (confirmed)="doDelete()" (cancelled)="showDel=false">
    </app-confirm-modal>
  `
})
export class AdminSeasonsComponent implements OnInit {
  seasons: Season[] = [];
  showForm = false; editingId = '';
  form: any = {}; logoFile: File | null = null; imageFile: File | null = null;
  saving = false; formError = '';
  showDel = false; delTarget: Season | null = null;

  constructor(private api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getAdminSeasons().subscribe(s => this.seasons = s.sort((a,b) => Number(a.display_order)-Number(b.display_order))); }

  openAdd() {
    this.editingId = ''; this.formError = '';
    this.form = { season_number: this.seasons.length + 1, season_name: '', year: '', champion_team: '', captain: '', man_of_series: '', runner_up: '', final_description: '', final_score: '', venue: '', status: 'ACTIVE', display_order: this.seasons.length + 1 };
    this.logoFile = null; this.imageFile = null; this.showForm = true;
  }

  openEdit(s: Season) {
    this.editingId = s.season_id; this.formError = '';
    this.form = { ...s }; this.logoFile = null; this.imageFile = null; this.showForm = true;
  }

  onFile(e: any, type: string) {
    const file = e.target.files[0];
    if (type === 'logo') this.logoFile = file;
    else this.imageFile = file;
  }

  save() {
    if (!this.form.season_name || !this.form.champion_team) { this.formError = 'Season name and champion team required'; return; }
    this.saving = true; this.formError = '';
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => fd.append(k, String(v ?? '')));
    if (this.logoFile) fd.append('champion_logo', this.logoFile);
    if (this.imageFile) fd.append('champion_image', this.imageFile);
    const obs = this.editingId ? this.api.updateSeason(this.editingId, fd) : this.api.createSeason(fd);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.toast.success('Season saved!'); this.load(); },
      error: (err) => { this.saving = false; this.formError = err.error?.error || 'Save failed'; }
    });
  }

  toggleStatus(s: Season) {
    const fd = new FormData(); fd.append('status', s.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE');
    this.api.updateSeason(s.season_id, fd).subscribe({ next: () => { this.toast.success('Updated'); this.load(); }, error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  confirmDel(s: Season) { this.delTarget = s; this.showDel = true; }
  doDelete() {
    if (!this.delTarget) return;
    this.api.deleteSeason(this.delTarget.season_id).subscribe({ next: () => { this.toast.success('Deleted'); this.showDel = false; this.load(); }, error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }
}
