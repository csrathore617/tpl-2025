import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-backup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:2rem">
      <h1 style="margin-bottom:0.5rem">📦 Backup & Data</h1>
      <p style="color:var(--text-muted);margin-bottom:2rem">Download tournament data and uploaded images</p>

      <!-- Drive Status -->
      <div class="card" style="margin-bottom:1.5rem" *ngIf="driveStatus">
        <h3 style="margin-bottom:1rem;color:var(--primary)">☁️ Google Drive Status</h3>
        <div *ngIf="driveStatus.driveEnabled" style="color:var(--success);font-weight:600">
          ✅ Google Drive integration is ACTIVE
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:4px">
            Excel File ID: {{ driveStatus.driveFileId }}<br>
            Images Folder ID: {{ driveStatus.driveFolderId }}
          </div>
        </div>
        <div *ngIf="!driveStatus.driveEnabled" style="color:var(--warning)">
          ⚠️ Google Drive not configured — using local Excel storage.
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:4px">
            Set GOOGLE_SERVICE_ACCOUNT_JSON, DRIVE_FILE_ID and DRIVE_FOLDER_ID env vars to enable Drive sync.
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-bottom:2rem">
        <!-- Excel Download -->
        <div class="card">
          <h3 style="margin-bottom:1rem;color:var(--primary)">📊 Excel Data File</h3>
          <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:1.5rem">
            Download the current tpl2026.xlsx containing all players, teams, auction records, seasons, gallery metadata and settings.
          </p>
          <a [href]="excelUrl" class="btn btn-success" target="_blank" style="display:inline-flex">
            ⬇️ Download Excel
          </a>
        </div>

        <!-- Full Backup -->
        <div class="card">
          <h3 style="margin-bottom:1rem;color:var(--primary)">📦 Complete Backup</h3>
          <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:1rem">
            Download a ZIP containing the Excel file and all uploaded images.
          </p>
          <div style="background:var(--bg-card2);padding:10px;border-radius:6px;font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem;font-family:monospace">
            TPL2026-Backup/<br>
            ├── tpl2026.xlsx<br>
            └── uploads/<br>
            &nbsp;&nbsp;&nbsp;&nbsp;├── image1.jpg<br>
            &nbsp;&nbsp;&nbsp;&nbsp;└── ...
          </div>
          <a [href]="backupUrl" class="btn btn-primary" target="_blank" style="display:inline-flex">
            📦 Download Full Backup
          </a>
        </div>
      </div>

      <!-- Images List -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h3 style="color:var(--primary)">🖼️ Uploaded Images</h3>
          <button class="btn btn-secondary btn-sm" (click)="loadImages()">🔄 Refresh</button>
        </div>

        <div *ngIf="loadingImages" class="spinner"></div>

        <div *ngIf="!loadingImages && images.length === 0" class="empty-state" style="padding:2rem">
          <div class="icon">🖼️</div>
          <p>No images uploaded yet</p>
        </div>

        <div class="table-wrap" *ngIf="!loadingImages && images.length">
          <table>
            <thead><tr><th>Preview</th><th>Name</th><th>Size</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let img of images">
                <td>
                  <img [src]="img.url" style="width:48px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--border)" [alt]="img.name">
                </td>
                <td style="font-size:0.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ img.name }}</td>
                <td style="font-size:0.8rem;color:var(--text-muted)">{{ formatSize(img.size) }}</td>
                <td>
                  <a [href]="img.url" target="_blank" class="btn btn-secondary btn-sm">⬇️ Download</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminBackupComponent implements OnInit {
  images: any[] = [];
  loadingImages = false;
  driveStatus: any = null;
  excelUrl = '';
  backupUrl = '';

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.excelUrl = this.api.getExcelDownloadUrl();
    this.backupUrl = this.api.getBackupDownloadUrl();
    this.api.getDriveStatus().subscribe({ next: s => this.driveStatus = s, error: () => {} });
    this.loadImages();
  }

  loadImages() {
    this.loadingImages = true;
    this.api.getBackupImages().subscribe({
      next: imgs => { this.images = imgs; this.loadingImages = false; },
      error: () => { this.loadingImages = false; this.toast.error('Failed to load images'); }
    });
  }

  formatSize(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
