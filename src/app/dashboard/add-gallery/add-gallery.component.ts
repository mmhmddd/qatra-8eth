import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { GalleryService, GalleryImage } from '../../core/services/gallery.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './add-gallery.component.html',
  styleUrls: ['./add-gallery.component.scss']
})
export class AddGalleryComponent {
visible() {
throw new Error('Method not implemented.');
}
percentage() {
throw new Error('Method not implemented.');
}
toggleToast() {
throw new Error('Method not implemented.');
}
  private galleryService = inject(GalleryService);
  private router = inject(Router);

  @ViewChild('addForm') addForm!: ElementRef;

  images: GalleryImage[] = [];
  isLoggedIn = false;
  newImage: { title: string; description: string | null; file: File | null; previewUrl: string | null; id?: string } = { title: '', description: '', file: null, previewUrl: null };
  message = '';
  isSuccess = true;
  isEditing = false; // Removed, no longer needed
position: any;

  ngOnInit() {
    this.checkLoginStatus();
    this.loadImages();
  }

  checkLoginStatus() {
    if (typeof localStorage !== 'undefined') {
      this.isLoggedIn = !!localStorage.getItem('token');
    }
  }

  loadImages() {
    this.galleryService.getAllImages().subscribe({
      next: response => {
        if (response.success) {
          this.images = response.data as GalleryImage[];
        } else {
          this.message = response.message;
          this.isSuccess = false;
        }
      },
      error: error => {
        this.message = error.message;
        this.isSuccess = false;
        if (error.message.includes('Redirecting to login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  addImage() {
    if (!this.newImage.title || !this.newImage.file) {
      this.message = 'العنوان والصورة مطلوبان';
      this.isSuccess = false;
      return;
    }
    this.galleryService.addImage(this.newImage.title, this.newImage.description, this.newImage.file).subscribe({
      next: response => {
        if (response.success) {
          this.images.push(response.data);
          this.resetForm();
          this.message = response.message;
          this.isSuccess = true;
        } else {
          this.message = response.message;
          this.isSuccess = false;
        }
      },
      error: error => {
        this.message = error.message;
        this.isSuccess = false;
        if (error.message.includes('Redirecting to login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  openEditForm(image: GalleryImage) {
    console.log('Opening edit form for image:', image);
    this.newImage = {
      id: image.id,
      title: image.title,
      description: image.description || '',
      file: null,
      previewUrl: this.galleryService.getImageUrl(image.imagePath)
    };
    this.scrollToForm();
  }

  updateImage() {
    if (!this.newImage.id) {
      this.message = 'معرف الصورة مطلوب';
      this.isSuccess = false;
      return;
    }
    this.galleryService.editImage(this.newImage.id, this.newImage.title, this.newImage.description, this.newImage.file).subscribe({
      next: response => {
        if (response.success) {
          const index = this.images.findIndex(img => img.id === response.data.id);
          if (index !== -1) {
            this.images[index] = response.data;
          }
          this.resetForm();
          this.message = response.message;
          this.isSuccess = true;
        } else {
          this.message = response.message;
          this.isSuccess = false;
        }
      },
      error: error => {
        this.message = error.message;
        this.isSuccess = false;
        if (error.message.includes('Redirecting to login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  cancelEdit() {
    this.resetForm();
    this.message = '';
  }

  deleteImage(id: string) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      this.galleryService.deleteImage(id).subscribe({
        next: response => {
          if (response.success) {
            this.images = this.images.filter(img => img.id !== id);
            this.message = response.message;
            this.isSuccess = true;
          } else {
            this.message = response.message;
            this.isSuccess = false;
          }
        },
        error: error => {
          this.message = error.message;
          this.isSuccess = false;
          if (error.message.includes('Redirecting to login')) {
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newImage.file = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.newImage.previewUrl = e.target?.result as string || null;
      };
      reader.readAsDataURL(file);
    }
  }

  private resetForm() {
    this.newImage = { title: '', description: '', file: null, previewUrl: null, id: undefined };
  }

  private scrollToForm() {
    if (this.addForm && this.addForm.nativeElement) {
      this.addForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getImageUrl(imagePath: string): string {
    return this.galleryService.getImageUrl(imagePath);
  }
}
