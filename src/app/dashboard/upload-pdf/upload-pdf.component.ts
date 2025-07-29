import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pdf, PdfService } from '../../core/services/pdf.service';
import { environment } from '../../../environments/environment';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-upload-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './upload-pdf.component.html',
  styleUrls: ['./upload-pdf.component.scss']
})
export class UploadPdfComponent implements OnInit {
  file: File | null = null;
  title: string = '';
  description: string = '';
  creatorName: string = '';
  message: string = '';
  isError: boolean = false;
  pdfs: Pdf[] = [];
  isLoading: boolean = false;

  constructor(private pdfService: PdfService) {}

  ngOnInit(): void {
    this.loadPdfs();
  }

  loadPdfs(): void {
    this.isLoading = true;
    this.pdfService.getPdfs().subscribe({
      next: (pdfs) => {
        this.pdfs = pdfs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Load PDFs error:', error);
        this.message = error.message || 'Failed to load PDFs';
        this.isError = true;
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    }
  }

  onSubmit(): void {
    if (!this.file || !this.title || !this.description || !this.creatorName) {
      this.message = 'All fields are required';
      this.isError = true;
      return;
    }

    if (this.file.type !== 'application/pdf') {
      this.message = 'Only PDF files are allowed';
      this.isError = true;
      return;
    }

    this.isLoading = true;
    this.pdfService.uploadPdf(this.file, this.title, this.description, this.creatorName)
      .subscribe({
        next: (pdf) => {
          this.message = 'PDF uploaded successfully';
          this.isError = false;
          this.resetForm();
          this.loadPdfs();
        },
        error: (error) => {
          console.error('Upload PDF error:', error);
          this.message = error.message || 'Failed to upload PDF';
          this.isError = true;
          this.isLoading = false;
        }
      });
  }

  deletePdf(id: string): void {
    if (confirm('Are you sure you want to delete this PDF?')) {
      console.log('Attempting to delete PDF with ID:', id);
      this.isLoading = true;
      this.pdfService.deletePdf(id).subscribe({
        next: (response) => {
          console.log('Delete response:', response);
          this.message = 'PDF deleted successfully';
          this.isError = false;
          this.pdfs = this.pdfs.filter(pdf => pdf.id !== id);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Delete PDF error:', {
            message: error.message,
            status: error.status,
            error: error.error,
            statusText: error.statusText
          });
          this.message = error.error?.message || 'Failed to delete PDF';
          this.isError = true;
          this.isLoading = false;
        }
      });
    }
  }

  resetForm(): void {
    this.file = null;
    this.title = '';
    this.description = '';
    this.creatorName = '';
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFullPdfUrl(filePath: string): string {
    return `${environment.apiBaseUrl}${filePath}`;
  }
}