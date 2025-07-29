import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pdf, PdfService } from '../../core/services/pdf.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  pdfs: Pdf[] = [];
  message: string = '';
  isError: boolean = false;

  constructor(private pdfService: PdfService) {}

  ngOnInit(): void {
    this.loadPdfs();
  }

  loadPdfs(): void {
    this.pdfService.getPdfs().subscribe({
      next: (pdfs) => {
        this.pdfs = pdfs;
        this.message = pdfs.length > 0 ? '' : 'No PDFs available in the library.';
        this.isError = false;
      },
      error: (error) => {
        console.error('Load PDFs error:', error);
        this.message = error.error?.message || 'Failed to load PDFs';
        this.isError = true;
      }
    });
  }

  getFullPdfUrl(filePath: string): string {
    return `${environment.apiBaseUrl}${filePath}`;
  }

  deletePdf(id: string): void {
    if (confirm('Are you sure you want to delete this PDF?')) {
      console.log('Attempting to delete PDF with ID:', id);
      this.pdfService.deletePdf(id).subscribe({
        next: (response) => {
          console.log('Delete response:', response);
          this.message = 'PDF deleted successfully';
          this.isError = false;
          this.pdfs = this.pdfs.filter(pdf => pdf.id !== id);
          if (this.pdfs.length === 0) {
            this.message = 'No PDFs available in the library.';
          }
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
        }
      });
    }
  }
}