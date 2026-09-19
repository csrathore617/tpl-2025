import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { GalleryItem, Season } from '../../../types/models';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <div><h1>Gallery Management</h1><p style="color:var(--text-muted)">{{ items.length }} images</p></div>
        <button class="btn btn-primary" (click)="showUpload=true">+ Upload Images</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar" style="margin-bottom:1.5rem">
        <select class="form-control" style="width:auto" [(ngModel)]="filterSeason" (ngModelChange)="applyFilter()">
          <option value="">All Seasons</option>
          <option *ngFor="let s of seasons" [value]="s.season_id">{{ s.season_name }}</option>
          <option value="GENERAL">General</option>
        </select>
        <select class="form-control" style="width:auto" [(ngModel)]="filterActive" (ngModelChange)="applyFilter()">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div class="gallery-admin-grid">
        <div class="gallery-admin-card" *ngFor="let item of filtered">
          <div class="gallery-thumb">
            <img *ngIf="item.image_path" [src]="getImg(item.image_path)" [alt]="item.title" loading="lazy">
            <div *ngIf="!item.image_path" class="gallery-no-img">📷<br><small>No image</small></div>
          </div>
          <div class="gallery-admin-info">
            <div style="font-weight:600;font-size:0.88rem;margin-bottom:2px">{{ item.title }}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">{{ item.description }}</div>
            <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
              <span class="badge badge-{{ item.active === 'true' || item.active === true ? 'active' : 'inactive' }}" style="font-size:0.65rem">
                {{ item.active === 'true' || item.active === true ? 'Active' : 'Inactive' }}
              </span>
              <span class="badge badge-registered" style="font-size:0.65rem">{{ getSeasonName(item.season_id) }}</span>
            </div>
          </div>
          <div class="gallery-admin-actions">
            <button class="btn btn-secondary btn-sm" (click)="openEdit(item)">Edit</button>
            <button class="btn btn-warning btn-sm" (click)="toggleActive(item)">{{ item.active === 'true' || item.active === true ? 'Hide' : 'Show' }}</button>
            <button class="btn btn-danger btn-sm" (click)="confirmDel(item)">Delete</button>
          </div>
        </div>
        <div *ngIf="filtered.length === 0" class="empty-state" style="grid-column:1/-1">
          <div class="icon">📷</div><h3>No images</h3>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div class="modal-overlay" *ngIf="showUpload" (click)="showUpload=false">
      <div class="modal" style="max-width:600px;width:100%" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Upload Images</h2>
        <div class="form-group">
          <label class="form-label">Season</label>
          <select class="form-control" [(ngModel)]="uploadForm.season_id">
            <option *ngFor="let s of seasons" [value]="s.season_id">{{ s.season_name }}</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-control" [(ngModel)]="uploadForm.category">
            <option>MATCH</option><option>CELEBRATION</option><option>FINAL</option><option>CEREMONY</option><option>TEAM</option><option>ACTION</option><option>GENERAL</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Images (JPG, PNG, WEBP – max 5MB each)</label>
          <input class="form-control" type="file" accept=".jpg,.jpeg,.png,.webp" multiple (change)="onFiles($event)">
        </div>
        <div *ngIf="previewUrls.length" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem">
          <img *ngFor="let url of previewUrls" [src]="url" style="width:80px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
        </div>
        <div *ngIf="uploadError" style="color:var(--danger);font-size:0.88rem;margin-bottom:1rem">❌ {{ uploadError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showUpload=false;previewUrls=[]">Cancel</button>
          <button class="btn btn-primary" (click)="doUpload()" [disabled]="uploading || !uploadFiles.length">
            {{ uploading ? 'Uploading...' : 'Upload ' + uploadFiles.length + ' image(s)' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" *ngIf="showEdit" (click)="showEdit=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Edit Image</h2>
        <div class="form-group">
          <label class="form-label">Title</label>
          <input class="form-control" [(ngModel)]="editForm.title">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-control" [(ngModel)]="editForm.description">
        </div>
        <div class="form-group">
          <label class="form-label">Season</label>
          <select class="form-control" [(ngModel)]="editForm.season_id">
            <option *ngFor="let s of seasons" [value]="s.season_id">{{ s.season_name }}</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Display Order</label>
          <input class="form-control" type="number" [(ngModel)]="editForm.display_order">
        </div>
        <div class="form-group">
          <label class="form-label">Featured</label>
          <select class="form-control" [(ngModel)]="editForm.featured">
            <option value="true">Yes</option><option value="false">No</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showEdit=false">Cancel</button>
          <button class="btn btn-primary" (click)="saveEdit()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <app-confirm-modal [visible]="showDel" title="Delete Image" [message]="'Delete ' + (delTarget?.title || '') + '?'"
      confirmText="Delete" confirmClass="danger" (confirmed)="doDelete()" (cancelled)="showDel=false">
    </app-confirm-modal>
  `,
  styles: [`
    .gallery-admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .gallery-admin-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .gallery-thumb { height: 160px; overflow: hidden; background: var(--bg-card2); }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-no-img { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 2rem; color: var(--text-muted); }
    .gallery-admin-info { padding: 0.75rem; }
    .gallery-admin-actions { padding: 0.5rem 0.75rem 0.75rem; display: flex; gap: 6px; flex-wrap: wrap; }
  `]
})
export class AdminGalleryComponent implements OnInit {
  items: GalleryItem[] = [];
  filtered: GalleryItem[] = [];
  seasons: Season[] = [];
  filterSeason = ''; filterActive = '';
  showUpload = false; uploadFiles: File[] = []; previewUrls: string[] = [];
  uploadForm = { season_id: 'GENERAL', category: 'GENERAL' };
  uploading = false; uploadError = '';
  showEdit = false; editForm: any = {}; editingId = ''; saving = false;
  showDel = false; delTarget: GalleryItem | null = null;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getAdminSeasons().subscribe(s => { this.seasons = s; if (s.length) this.uploadForm.season_id = s[0].season_id; });
    this.load();
  }

  load() { this.api.getAdminGallery().subscribe(i => { this.items = i; this.applyFilter(); }); }

  applyFilter() {
    let r = [...this.items];
    if (this.filterSeason) r = r.filter(i => i.season_id === this.filterSeason);
    if (this.filterActive) r = r.filter(i => String(i.active) === this.filterActive);
    this.filtered = r;
  }

  getSeasonName(id: string): string {
    if (id === 'GENERAL') return 'General';
    return this.seasons.find(s => s.season_id === id)?.season_name || id;
  }

  getImg(p: string): string { return this.api.getImageUrl(p); }

  onFiles(e: any) {
    this.uploadFiles = Array.from(e.target.files);
    this.previewUrls = this.uploadFiles.map(f => URL.createObjectURL(f));
  }

  doUpload() {
    if (!this.uploadFiles.length) return;
    this.uploading = true; this.uploadError = '';
    const fd = new FormData();
    this.uploadFiles.forEach(f => fd.append('images', f));
    fd.append('season_id', this.uploadForm.season_id);
    fd.append('category', this.uploadForm.category);
    this.api.uploadGallery(fd).subscribe({
      next: () => { this.uploading = false; this.showUpload = false; this.uploadFiles = []; this.previewUrls = []; this.toast.success('Images uploaded!'); this.load(); },
      error: (err) => { this.uploading = false; this.uploadError = err.error?.error || 'Upload failed'; }
    });
  }

  openEdit(item: GalleryItem) { this.editingId = item.gallery_id; this.editForm = { ...item }; this.showEdit = true; }

  saveEdit() {
    this.saving = true;
    this.api.updateGalleryItem(this.editingId, this.editForm).subscribe({
      next: () => { this.saving = false; this.showEdit = false; this.toast.success('Updated!'); this.load(); },
      error: (err) => { this.saving = false; this.toast.error(err.error?.error || 'Failed'); }
    });
  }

  toggleActive(item: GalleryItem) {
    const active = !(item.active === 'true' || item.active === true);
    this.api.updateGalleryItem(item.gallery_id, { ...item, active: String(active) }).subscribe({
      next: () => { this.toast.success('Updated'); this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }

  confirmDel(item: GalleryItem) { this.delTarget = item; this.showDel = true; }
  doDelete() {
    if (!this.delTarget) return;
    this.api.deleteGalleryItem(this.delTarget.gallery_id).subscribe({
      next: () => { this.toast.success('Deleted'); this.showDel = false; this.load(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }
}
