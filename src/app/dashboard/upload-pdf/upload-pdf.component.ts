import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pdf, PdfService } from '../../core/services/pdf.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-upload-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './upload-pdf.component.html',
  styleUrls: ['./upload-pdf.component.scss']
})
export class UploadPdfComponent {
  // Form fields
  title = '';
  description = '';
  creatorName = '';
  selectedFile: File | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // PDF list
  pdfs: Pdf[] = [];

  constructor(private pdfService: PdfService) {
    this.loadPdfs();
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  // Upload PDF
  uploadPdf(): void {
    if (!this.selectedFile || !this.title || !this.description || !this.creatorName) {
      this.errorMessage = 'يرجى ملء جميع الحقول واختيار ملف PDF';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    this.pdfService.uploadPdf(this.selectedFile, this.title, this.description, this.creatorName)
      .subscribe({
        next: (pdf) => {
          this.successMessage = 'تم رفع ملف PDF بنجاح';
          this.resetForm();
          this.loadPdfs(); // Refresh the list
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
  }

  // Load all PDFs
  private loadPdfs(): void {
    this.pdfService.getPdfs()
      .subscribe({
        next: (pdfs) => {
          this.pdfs = pdfs;
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
  }

  // Delete PDF
  deletePdf(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      this.pdfService.deletePdf(id)
        .subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.loadPdfs(); // Refresh the list
          },
          error: (err) => {
            this.errorMessage = err.message;
          }
        });
    }
  }

  // View PDF
  viewPdf(id: string): void {
    this.pdfService.getPdfDetails(id)
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank'); // Open PDF in a new tab
          URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
  }

  // Track by function for better performance
  trackByPdfId(index: number, pdf: Pdf): string {
    return pdf.id;
  }

  // Reset form after successful upload
  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.creatorName = '';
    this.selectedFile = null;
    (document.getElementById('pdfFile') as HTMLInputElement).value = '';
  }
}
