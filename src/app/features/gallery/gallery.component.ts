import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GalleryService, GalleryImage, GalleryResponse } from '../../core/services/gallery.service';
import { Observable } from 'rxjs';
import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this to suppress Web Component errors
})
export class GalleryComponent implements OnInit {
  images$: Observable<GalleryResponse> | undefined;
  latestImages: GalleryImage[] = [];
  popularImages: GalleryImage[] = [];
  allImages: GalleryImage[] = [];
  featuredImages: GalleryImage[] = [];

  constructor(private galleryService: GalleryService) {}

  ngOnInit(): void {
    // Register Swiper web components
    register();

    this.images$ = this.galleryService.getAllImages();
    this.images$.subscribe({
      next: (response) => {
        if (response.success) {
          const images = Array.isArray(response.data) ? response.data : [];
          // Sort by createdAt for latest images
          this.latestImages = images
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
          // Simulate popular images based on views or likes (mocked for simplicity)
          this.popularImages = images
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6);
          // All images
          this.allImages = images;
          // Featured images for hero slider (ensure at least 5 images)
          this.featuredImages = images.slice(0, Math.max(5, images.length));
        }
      },
      error: (error) => {
        console.error('فشل في تحميل صور المعرض:', error);
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.galleryService.getImageUrl(imagePath);
  }
}
