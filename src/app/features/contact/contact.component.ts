import { Component, Inject, PLATFORM_ID, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('open', style({
        maxHeight: '300px',
        opacity: 1,
        paddingTop: '0',
        paddingBottom: '0'
      })),
      state('closed', style({
        maxHeight: '0px',
        opacity: 0,
        paddingTop: '0',
        paddingBottom: '0'
      })),
      transition('closed <=> open', [
        animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('iconRotate', [
      state('open', style({ transform: 'rotate(180deg)' })),
      state('closed', style({ transform: 'rotate(0deg)' })),
      transition('closed <=> open', [
        animate('0.3s ease-in-out')
      ])
    ])
  ]
})
export class ContactComponent implements AfterViewInit {
  @ViewChildren('faqAnswer') faqAnswers!: QueryList<ElementRef>;
  
  contactForm: FormGroup;
  submitted = false;
  activeFaq: number | null = null;
  isFormSubmitting = false;
  formSubmissionMessage = '';

  // FAQ data
  faqData = [
    {
      question: 'كيف يمكنني الانضمام إلى البرامج التعليمية؟',
      answer: 'يمكنك الانضمام إلى برامجنا التعليمية من خلال التسجيل عبر موقعنا الإلكتروني أو التواصل معنا مباشرة عبر الهاتف أو البريد الإلكتروني. نقدم برامج متنوعة تناسب جميع الأعمار والمستويات التعليمية المختلفة.'
    },
    {
      question: 'ما هي فرص التطوع المتاحة؟',
      answer: 'نوفر فرص تطوع متنوعة في التدريس، تنظيم الفعاليات، إدارة المشاريع، والدعم الإداري. يمكنك ملء استمارة التطوع على موقعنا أو التواصل مع فريقنا لمعرفة المزيد عن الفرص المتاحة وتحديد ما يناسب خبراتك واهتماماتك.'
    },
    {
      question: 'كيف يمكنني تقديم الدعم للمبادرة؟',
      answer: 'يمكنك تقديم الدعم من خلال عدة طرق: التبرع المالي عبر موقعنا الإلكتروني، المشاركة في فعالياتنا الخيرية، التطوع بوقتك ومهاراتك، أو التواصل معنا لمناقشة خيارات الرعاية والشراكات طويلة المدى.'
    },
    {
      question: 'ما هي أوقات العمل وكيف يمكن زيارة المركز؟',
      answer: 'نعمل من الأحد إلى الخميس من الساعة 8:00 صباحاً حتى 4:00 مساءً. يمكنكم زيارة مركزنا في أي وقت خلال ساعات العمل، ونرحب بالزيارات المسبقة بموعد لضمان توفر المختصين لاستقبالكم وتقديم أفضل خدمة.'
    }
  ];

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+962|962|0)?(7[7-9]|6)\d{7}$/)]],
      service: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Add intersection observer for animations
      this.setupScrollAnimations();
    }
  }

  private setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('.contact-details, .whatsapp-section, .faq-section, .contact-form, .map-section');
    sections.forEach(section => observer.observe(section));
  }

  scrollToForm() {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById('contact-form');
      if (element) {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

  openWhatsApp() {
    if (isPlatformBrowser(this.platformId)) {
      const whatsappUrl = `https://wa.me/+96279876543?text=${encodeURIComponent('مرحبا، أود التواصل معكم بخصوص المبادرة التعليمية')}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  toggleFaq(index: number) {
    // Close currently open FAQ if clicking on the same one
    if (this.activeFaq === index) {
      this.activeFaq = null;
    } else {
      this.activeFaq = index;
    }

    // Add a small delay to ensure smooth animation
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.updateFaqAnswerClasses();
      }, 50);
    }
  }

  private updateFaqAnswerClasses() {
    if (this.faqAnswers) {
      this.faqAnswers.forEach((answerEl, index) => {
        const element = answerEl.nativeElement;
        if (this.activeFaq === index) {
          element.classList.add('open');
        } else {
          element.classList.remove('open');
        }
      });
    }
  }

  getFaqState(index: number): string {
    return this.activeFaq === index ? 'open' : 'closed';
  }

  getIconState(index: number): string {
    return this.activeFaq === index ? 'open' : 'closed';
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.valid && field.touched);
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} مطلوب`;
      }
      if (field.errors['email']) {
        return 'البريد الإلكتروني غير صالح';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phone') {
          return 'يرجى إدخال رقم هاتف أردني صالح (مثال: 0791234567)';
        }
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `يجب أن يكون ${this.getFieldDisplayName(fieldName)} ${requiredLength} أحرف على الأقل`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `يجب أن لا يتجاوز ${this.getFieldDisplayName(fieldName)} ${maxLength} حرف`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'name': 'الاسم',
      'email': 'البريد الإلكتروني',
      'phone': 'رقم الهاتف',
      'service': 'الخدمة',
      'message': 'الرسالة'
    };
    return fieldNames[fieldName] || fieldName;
  }

  async onSubmit() {
    this.submitted = true;
    this.isFormSubmitting = true;
    this.formSubmissionMessage = '';

    if (this.contactForm.valid) {
      try {
        // Simulate form submission delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const formValue = this.contactForm.value;
        
        // Create WhatsApp message
        const whatsappMessage = this.createWhatsAppMessage(formValue);
        
        // Open WhatsApp
        if (isPlatformBrowser(this.platformId)) {
          const whatsappUrl = `https://wa.me/+96279876543?text=${encodeURIComponent(whatsappMessage)}`;
          window.open(whatsappUrl, '_blank');
        }

        // Show success message
        this.formSubmissionMessage = 'تم إرسال الرسالة بنجاح! سيتم تحويلك إلى WhatsApp.';
        
        // Reset form after successful submission
        setTimeout(() => {
          this.contactForm.reset();
          this.submitted = false;
          this.formSubmissionMessage = '';
        }, 3000);

        console.log('Form Submitted:', formValue);
        
      } catch (error) {
        console.error('Form submission error:', error);
        this.formSubmissionMessage = 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.';
      }
    } else {
      this.formSubmissionMessage = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح.';
      this.scrollToFirstError();
    }

    this.isFormSubmitting = false;
  }

  private createWhatsAppMessage(formValue: any): string {
    const serviceNames: { [key: string]: string } = {
      'educational-programs': 'برامج تعليمية',
      'volunteering': 'فرص تطوعية',
      'support': 'دعم شخصي',
      'other': 'أخرى'
    };

    return `🌟 رسالة جديدة من موقع المبادرة التعليمية 🌟

👤 الاسم: ${formValue.name}
📧 البريد الإلكتروني: ${formValue.email}
📱 رقم الهاتف: ${formValue.phone}
🎯 الخدمة المطلوبة: ${serviceNames[formValue.service] || formValue.service}

💬 الرسالة:
${formValue.message}

---
تم إرسال هذه الرسالة من خلال نموذج الاتصال في الموقع الإلكتروني.`;
  }

  private scrollToFirstError() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const firstErrorField = document.querySelector('.form-control.is-invalid');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          (firstErrorField as HTMLElement).focus();
        }
      }, 100);
    }
  }

  // Utility method for form field classes
  getFieldClasses(fieldName: string): string {
    const baseClasses = 'form-control';
    const field = this.contactForm.get(fieldName);
    
    if (!field) return baseClasses;
    
    if (this.isFieldInvalid(fieldName)) {
      return `${baseClasses} is-invalid`;
    }
    
    if (this.isFieldValid(fieldName)) {
      return `${baseClasses} is-valid`;
    }
    
    return baseClasses;
  }

  // Method to handle input focus events
  onFieldFocus(fieldName: string) {
    const field = this.contactForm.get(fieldName);
    if (field) {
      field.markAsTouched();
    }
  }

  // Method to clear form
  clearForm() {
    this.contactForm.reset();
    this.submitted = false;
    this.formSubmissionMessage = '';
  }
}