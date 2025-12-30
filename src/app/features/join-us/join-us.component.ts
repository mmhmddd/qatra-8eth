import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { JoinRequestService } from '../../core/services/join-request.service';
import { JoinUsService, Message } from '../../core/services/join-us.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, timer } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export class CustomValidators {
  static fullName(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;
    const namePattern = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!namePattern.test(value)) return { pattern: true };
    if (value.replace(/\s/g, '').length === 0) return { onlySpaces: true };
    return null;
  }

  static enhancedEmail(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(control.value) ? null : { email: true };
  }

  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;
    const phonePattern = /^\d{9,12}$/;
    return phonePattern.test(value) ? null : { pattern: true };
  }
}

interface JoinFormData {
  name: string;
  email: string;
  number: string;
  academicSpecialization: string;
  address: string;
}

@Component({
  selector: 'app-join-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './join-us.component.html',
  styleUrls: ['./join-us.component.scss']
})
export class JoinUsComponent implements OnInit, OnDestroy {
  joinForm!: FormGroup;
  isPending = false;
  isSubmitting = false;
  emailExistsError = false;
  generalError: string | null = null;
  joinStatusMessage: Message | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private joinRequestService: JoinRequestService,
    private joinUsService: JoinUsService,
    public translationService: TranslationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupFormChangeListeners();
    this.loadJoinStatusMessage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.joinForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), CustomValidators.fullName]],
      email: ['', [Validators.required, CustomValidators.enhancedEmail]],
      number: ['', [Validators.required, CustomValidators.phoneNumber]],
      academicSpecialization: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
    });
  }

  private loadJoinStatusMessage(): void {
    this.joinUsService.getMessages().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const visible = response.messages.filter((m: Message) => m.isVisible);
        this.joinStatusMessage = visible.length > 0 ? visible[0] : null;
      },
      error: () => this.joinStatusMessage = null
    });
  }

  private setupFormChangeListeners(): void {
    this.joinForm.get('email')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.emailExistsError) {
        this.emailExistsError = false;
        const ctrl = this.joinForm.get('email');
        if (ctrl?.errors?.['emailExists']) {
          delete ctrl.errors['emailExists'];
          if (Object.keys(ctrl.errors).length === 0) ctrl.setErrors(null);
        }
      }
    });

    this.joinForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.generalError) this.generalError = null;
    });
  }

  isFieldInvalid(field: string): boolean {
    const c = this.joinForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  isFieldValid(field: string): boolean {
    const c = this.joinForm.get(field);
    return !!(c && c.valid && (c.dirty || c.touched));
  }

  private markAllTouched(): void {
    Object.keys(this.joinForm.controls).forEach(k => this.joinForm.get(k)?.markAsTouched());
  }

  onSubmit(): void {
    this.resetErrors();
    this.isSubmitting = true;

    this.markAllTouched();
    if (!this.joinForm.valid) {
      this.generalError = this.translationService.translate('joinUs.formInvalid');
      this.isSubmitting = false;
      this.scrollToTop();
      return;
    }

    const data: JoinFormData = this.joinForm.value;

    this.joinRequestService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.handleSuccess(res, data.email),
        error: (err: HttpErrorResponse) => {
          this.handleErrorResponse(err);
          this.isSubmitting = false;
          this.scrollToTop();
        }
      });
  }

  private handleSuccess(res: any, email: string): void {
    // Reset the form
    this.joinForm.reset();
    Object.keys(this.joinForm.controls).forEach(k => {
      const c = this.joinForm.get(k);
      c?.markAsPristine();
      c?.markAsUntouched();
    });

    // ✅ FIX: Stop the loading state
    this.isSubmitting = false;

    // Show success message
    this.isPending = true;
    timer(5000).pipe(takeUntil(this.destroy$)).subscribe(() => this.isPending = false);

    // Scroll to top to show success message
    this.scrollToTop();
  }

  private handleErrorResponse(error: HttpErrorResponse): void {
    console.error('API Error:', error);

    const msg = (error.error?.message || '').toString().toLowerCase();
    const code = error.error?.code;

    const isEmailExists =
      error.status === 409 ||
      code === 'EMAIL_EXISTS' ||
      (msg.includes('email') && msg.includes('exist')) ||
      (msg.includes('البريد') && msg.includes('مستخدم'));

    if (isEmailExists) {
      this.emailExistsError = true;
      const emailCtrl = this.joinForm.get('email');
      emailCtrl?.setErrors({ emailExists: true });
      return;
    }

    // Other errors
    if (error.status === 400) {
      this.generalError = this.translationService.translate('joinUs.invalidData');
    } else if (error.status === 500) {
      this.generalError = this.translationService.translate('joinUs.serverError');
    } else if (error.status === 0) {
      this.generalError = this.translationService.translate('joinUs.networkError');
    } else {
      this.generalError = this.translationService.translate('joinUs.unexpectedError');
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private resetErrors(): void {
    this.emailExistsError = false;
    this.generalError = null;
    const emailCtrl = this.joinForm.get('email');
    if (emailCtrl?.errors?.['emailExists']) {
      delete emailCtrl.errors['emailExists'];
      if (Object.keys(emailCtrl.errors).length === 0) emailCtrl.setErrors(null);
    }
  }

  dismissEmailError(): void {
    this.emailExistsError = false;
    const c = this.joinForm.get('email');
    if (c?.errors?.['emailExists']) {
      delete c.errors['emailExists'];
      if (Object.keys(c.errors).length === 0) c.setErrors(null);
    }
  }

  dismissGeneralError(): void {
    this.generalError = null;
  }

  dismissJoinStatus(): void {
    this.joinStatusMessage = null;
  }
}
