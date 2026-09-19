import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GalleryItem, Season } from '../../types/models';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Lightbox -->
    <div class="lightbox" *ngIf="lightboxItem" (click)="closeLightbox()">
      <div class="lightbox-inner" (click)="$event.stopPropagation()">
        <button class="lb-close" (click)="closeLightbox()">✕</button>
        <button class="lb-nav lb-prev" (click)="prevImage()" *ngIf="filtered.length > 1">‹</button>
        <button class="lb-nav lb-next" (click)="nextImage()" *ngIf="filtered.length > 1">›</button>
        <div class="lb-img-wrap">
          <img [src]="getImg(lightboxItem.image_path)" [alt]="lightboxItem.title" class="lb-img" *ngIf="lightboxItem.image_path; else lbNoImg">
          <ng-template #lbNoImg>
            <div class="lb-placeholder">📷</div>
          </ng-template>
        </div>
        <div class="lb-info">
          <h3>{{ lightboxItem.title }}</h3>
          <p *ngIf="lightboxItem.description">{{ lightboxItem.description }}</p>
          <span class="badge badge-available" *ngIf="lightboxItem.season_id !== 'GENERAL'">
            🏆 {{ getSeasonName(lightboxItem.season_id) }}
          </span>
          <span class="badge badge-registered" *ngIf="lightboxItem.season_id === 'GENERAL'">General</span>
        </div>
      </div>
    </div>

    <div class="container" style="padding:2rem 1.5rem">
      <div class="page-header">
        <h1 class="page-title">📸 Tournament Gallery</h1>
        <p class="page-subtitle">Relive the best moments from TPL history</p>
      </div>

      <!-- Filters -->
      <div class="filter-bar" style="margin-bottom:1.5rem">
        <button class="filter-btn" [class.active]="activeFilter === ''" (click)="setFilter('')">All</button>
        <button class="filter-btn" *ngFor="let s of seasons" [class.active]="activeFilter === s.season_id" (click)="setFilter(s.season_id)">
          {{ s.season_name }}
        </button>
        <button class="filter-btn" [class.active]="activeFilter === 'GENERAL'" (click)="setFilter('GENERAL')">General</button>
      </div>

      <div *ngIf="loading" class="gallery-grid">
        <div class="gallery-skeleton skeleton" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
      </div>

      <div *ngIf="!loading && filtered.length === 0" class="empty-state">
        <div class="icon">📷</div>
        <h3>No images yet</h3>
        <p>Gallery images will appear here once uploaded by admin</p>
      </div>

      <div class="gallery-grid" *ngIf="!loading && filtered.length">
        <div class="gallery-item" *ngFor="let item of filtered; let i = index" (click)="openLightbox(item, i)">
          <div class="gallery-img-wrap">
            <img *ngIf="item.image_path" [src]="getImg(item.image_path)" [alt]="item.title" loading="lazy" class="gallery-img">
            <div *ngIf="!item.image_path" class="gallery-placeholder">📷</div>
            <div class="gallery-overlay">
              <span class="gallery-zoom">🔍</span>
            </div>
          </div>
          <div class="gallery-caption">
            <div class="gallery-title">{{ item.title }}</div>
            <div class="gallery-desc" *ngIf="item.description">{{ item.description }}</div>
            <span class="badge badge-available" style="font-size:0.7rem" *ngIf="item.season_id !== 'GENERAL'">
              🏆 {{ getSeasonName(item.season_id) }}
            </span>
          </div>
        </div>
      </div>

      <div style="margin-top:1rem;color:var(--text-muted);font-size:0.85rem" *ngIf="!loading">
        {{ filtered.length }} image{{ filtered.length !== 1 ? 's' : '' }}
      </div>
    </div>
  `,
  styles: [`
    .filter-btn { padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-card2); color: var(--text-muted); cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.2s; }
    .filter-btn.active, .filter-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }
    .gallery-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .gallery-skeleton { height: 220px; border-radius: var(--radius); }
    .gallery-item { border-radius: var(--radius); overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .gallery-item:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .gallery-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .gallery-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .gallery-item:hover .gallery-img { transform: scale(1.05); }
    .gallery-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; background: var(--bg-card2); }
    .gallery-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .gallery-item:hover .gallery-overlay { background: rgba(0,0,0,0.4); }
    .gallery-zoom { font-size: 2rem; opacity: 0; transition: opacity 0.2s; }
    .gallery-item:hover .gallery-zoom { opacity: 1; }
    .gallery-caption { padding: 0.75rem; }
    .gallery-title { font-weight: 600; font-size: 0.88rem; margin-bottom: 3px; }
    .gallery-desc { color: var(--text-muted); font-size: 0.78rem; margin-bottom: 4px; }
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .lightbox-inner { position: relative; max-width: 900px; width: 100%; background: var(--bg-card); border-radius: var(--radius); overflow: hidden; }
    .lb-close { position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(0,0,0,0.6); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1rem; }
    .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.6); border: none; color: white; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; }
    .lb-prev { left: 12px; }
    .lb-next { right: 12px; }
    .lb-img-wrap { max-height: 70vh; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; }
    .lb-img { max-width: 100%; max-height: 70vh; object-fit: contain; }
    .lb-placeholder { width: 100%; height: 300px; display: flex; align-items: center; justify-content: center; font-size: 5rem; }
    .lb-info { padding: 1rem 1.5rem; }
    .lb-info h3 { margin-bottom: 4px; }
    .lb-info p { color: var(--text-muted); font-size: 0.88rem; margin-bottom: 8px; }
    @media (max-width: 1024px) { .gallery-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .gallery-grid { grid-template-columns: 1fr; } }
  `]
})
export class GalleryComponent implements OnInit {
  allItems: GalleryItem[] = [];
  filtered: GalleryItem[] = [];
  seasons: Season[] = [];
  loading = true;
  activeFilter = '';
  lightboxItem: GalleryItem | null = null;
  lightboxIndex = 0;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['season']) this.activeFilter = params['season'];
    });
    this.api.getSeasons().subscribe(s => this.seasons = s);
    this.api.getGallery().subscribe({
      next: items => { this.allItems = items; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  setFilter(f: string) { this.activeFilter = f; this.applyFilter(); }

  applyFilter() {
    this.filtered = this.activeFilter ? this.allItems.filter(i => i.season_id === this.activeFilter) : this.allItems;
  }

  getSeasonName(id: string): string {
    return this.seasons.find(s => s.season_id === id)?.season_name || id;
  }

  getImg(p: string): string { return this.api.getImageUrl(p); }

  openLightbox(item: GalleryItem, index: number) { this.lightboxItem = item; this.lightboxIndex = index; }
  closeLightbox() { this.lightboxItem = null; }
  prevImage() { this.lightboxIndex = (this.lightboxIndex - 1 + this.filtered.length) % this.filtered.length; this.lightboxItem = this.filtered[this.lightboxIndex]; }
  nextImage() { this.lightboxIndex = (this.lightboxIndex + 1) % this.filtered.length; this.lightboxItem = this.filtered[this.lightboxIndex]; }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.lightboxItem) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowLeft') this.prevImage();
    if (e.key === 'ArrowRight') this.nextImage();
  }
}
