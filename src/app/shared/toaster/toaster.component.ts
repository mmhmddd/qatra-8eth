import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToasterService } from '../../core/services/toaster.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="toast toast-{{toast.type}}"
        [class.fade-in]="true"
        role="alert"
        aria-live="assertive"
        aria-atomic="true">
        
        <div class="toast-header" *ngIf="toast.title">
          <i [class]="toast.icon" class="toast-icon"></i>
          <strong class="toast-title">{{ toast.title }}</strong>
          <button 
            *ngIf="toast.dismissible"
            type="button" 
            class="toast-close" 
            (click)="dismissToast(toast.id)"
            aria-label="إغلاق">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="toast-body">
          <div class="toast-content">
            <i [class]="toast.icon" class="toast-icon" *ngIf="!toast.title"></i>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button 
            *ngIf="toast.dismissible && !toast.title"
            type="button" 
            class="toast-close" 
            (click)="dismissToast(toast.id)"
            aria-label="إغلاق">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      direction: rtl;
    }

    .toast {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      margin-bottom: 16px;
      overflow: hidden;
      border-right: 4px solid;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-width: 300px;
      max-width: 400px;
      word-wrap: break-word;
    }

    .toast-success {
      border-right-color: #28a745;
      background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
    }

    .toast-error {
      border-right-color: #dc3545;
      background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
    }

    .toast-warning {
      border-right-color: #ffc107;
      background: linear-gradient(135deg, #fffbf0 0%, #fff3cd 100%);
    }

    .toast-info {
      border-right-color: #17a2b8;
      background: linear-gradient(135deg, #f0f9ff 0%, #e6f3ff 100%);
    }

    .toast-header {
      padding: 12px 16px 8px 16px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .toast-body {
      padding: 12px 16px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      flex-grow: 1;
    }

    .toast-icon {
      font-size: 18px;
      margin-left: 12px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toast-success .toast-icon {
      color: #28a745;
    }

    .toast-error .toast-icon {
      color: #dc3545;
    }

    .toast-warning .toast-icon {
      color: #ffc107;
    }

    .toast-info .toast-icon {
      color: #17a2b8;
    }

    .toast-title {
      font-weight: 600;
      font-size: 16px;
      flex-grow: 1;
      color: #1a1a1a;
    }

    .toast-message {
      font-size: 14px;
      line-height: 1.5;
      color: #545454;
      flex-grow: 1;
    }

    .toast-close {
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .toast-close:hover {
      color: #495057;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .toast-close i {
      font-size: 12px;
    }

    .fade-in {
      animation: fadeInSlide 0.4s ease-out;
    }

    @keyframes fadeInSlide {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .toast-container {
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast {
        min-width: auto;
        max-width: none;
      }
    }

    @media (max-width: 576px) {
      .toast-container {
        top: 10px;
        right: 5px;
        left: 5px;
      }

      .toast-header,
      .toast-body {
        padding: 10px 12px;
      }

      .toast-icon {
        font-size: 16px;
        margin-left: 8px;
      }

      .toast-title {
        font-size: 14px;
      }

      .toast-message {
        font-size: 13px;
      }
    }
  `]
})
export class ToasterComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private destroy$ = new Subject<void>();

  constructor(private toasterService: ToasterService) {}

  ngOnInit(): void {
    this.toasterService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => {
        this.toasts = toasts;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismissToast(id: string): void {
    this.toasterService.dismiss(id);
  }

  trackByToastId(index: number, toast: ToastMessage): string {
    return toast.id;
  }
}