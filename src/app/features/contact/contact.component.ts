import { Component, Inject, PLATFORM_ID } from '@angular/core';
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
        maxHeight: '200px',
        opacity: 1,
        paddingBottom: '1.5rem'
      })),
      state('closed', style({
        maxHeight: '0',
        opacity: 0,
        paddingBottom: '0'
      })),
      transition('closed <=> open', [
        animate('0.3s ease-in-out')
      ])
    ])
  ]
})
export class ContactComponent {
  contactForm: FormGroup;
  submitted = false;
  activeFaq: number | null = null;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+\d{10,15}$/)]],
      service: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
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
      const whatsappUrl = `https://wa.me/+96279876543?text=مرحبا، أود التواصل معكم بخصوص المبادرة التعليمية`;
      window.open(whatsappUrl, '_blank');
    }
  }

  toggleFaq(index: number) {
    this.activeFaq = this.activeFaq === index ? null : index;
  }

  onSubmit() {
    this.submitted = true;
    if (this.contactForm.valid) {
      const formValue = this.contactForm.value;
      const whatsappMessage = `الاسم: ${formValue.name}\nالبريد: ${formValue.email}\nالهاتف: ${formValue.phone}\nالخدمة: ${formValue.service}\nالرسالة: ${formValue.message}`;
      const whatsappUrl = `https://wa.me/+96279876543?text=${encodeURIComponent(whatsappMessage)}`;
      if (isPlatformBrowser(this.platformId)) {
        window.open(whatsappUrl, '_blank');
      }
      console.log('Form Submitted:', this.contactForm.value);
      this.contactForm.reset();
      this.submitted = false;
    }
  }
  
}
