import { Component, OnInit } from '@angular/core';
import { GalleryService, GalleryImage } from '../../core/services/gallery.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-section',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './image-section.component.html',
  styleUrl: './image-section.component.scss'
})
export class ImageSectionComponent implements OnInit {
  displayedImages: GalleryImage[] = [];

  constructor(private galleryService: GalleryService, private router: Router) {}

  ngOnInit() {
    this.galleryService.getAllImages().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.displayedImages = response.data.slice(0, 4);
        }
      },
      error: (error) => {
        console.error('Failed to load images:', error);
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.galleryService.getImageUrl(imagePath);
  }
}
