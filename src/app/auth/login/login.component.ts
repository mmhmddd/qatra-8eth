import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px)' }),
        animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('shake', [
      transition('* => *', [
        animate('0.5s', style({ transform: 'translateX(0)' })),
        animate('0.1s', style({ transform: 'translateX(-10px)' })),
        animate('0.1s', style({ transform: 'translateX(10px)' })),
        animate('0.1s', style({ transform: 'translateX(-10px)' })),
        animate('0.1s', style({ transform: 'translateX(10px)' })),
        animate('0.1s', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  submitted = false;
  isLoading = false;
  showPassword = false;
  rememberMe = false;
  loginError = '';
  loginSuccess = '';
  
  // Background animation interval
  private backgroundInterval: any;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupBackgroundAnimation();
      this.setupScrollAnimations();
      
      // Load saved email if remember me was checked
      const savedEmail = localStorage.getItem('rememberedEmail');
      const wasRemembered = localStorage.getItem('rememberMe') === 'true';
      
      if (savedEmail && wasRemembered) {
        this.loginForm.patchValue({
          email: savedEmail,
          rememberMe: true
        });
        this.rememberMe = true;
      }
    }
  }

  ngOnDestroy() {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
    }
  }

  private setupBackgroundAnimation() {
    // Add floating particles animation
    let particleCount = 0;
    this.backgroundInterval = setInterval(() => {
      if (particleCount < 20) {
        this.createFloatingParticle();
        particleCount++;
      }
    }, 2000);
  }

  private createFloatingParticle() {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
    particle.style.opacity = (Math.random() * 0.5 + 0.1).toString();
    
    const loginSection = document.querySelector('.login-section');
    if (loginSection) {
      loginSection.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 5000);
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
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe animated elements
    const animatedElements = document.querySelectorAll('.login-card, .welcome-content, .feature-card');
    animatedElements.forEach(el => observer.observe(el));
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.valid && field.touched);
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        const fieldNames: { [key: string]: string } = {
          'email': 'البريد الإلكتروني',
          'password': 'كلمة المرور'
        };
        return `${fieldNames[fieldName]} مطلوب`;
      }
      if (field.errors['email']) {
        return 'البريد الإلكتروني غير صالح';
      }
      if (field.errors['minlength']) {
        return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
    }
    return '';
  }

  getFieldClasses(fieldName: string): string {
    const baseClasses = 'form-control';
    
    if (this.isFieldInvalid(fieldName)) {
      return `${baseClasses} is-invalid`;
    }
    
    if (this.isFieldValid(fieldName)) {
      return `${baseClasses} is-valid`;
    }
    
    return baseClasses;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onRememberMeChange(event: any) {
    this.rememberMe = event.target.checked;
    this.loginForm.patchValue({ rememberMe: this.rememberMe });
  }

  async onSubmit() {
    this.submitted = true;
    this.isLoading = true;
    this.loginError = '';
    this.loginSuccess = '';

    if (this.loginForm.valid) {
      try {
        // Simulate API call
        await this.simulateLogin();
        
        const formValue = this.loginForm.value;
        
        // Handle remember me functionality
        if (isPlatformBrowser(this.platformId)) {
          if (formValue.rememberMe) {
            localStorage.setItem('rememberedEmail', formValue.email);
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberMe');
          }
        }

        this.loginSuccess = 'تم تسجيل الدخول بنجاح! جاري توجيهك...';
        
        // Simulate successful login and redirect
        setTimeout(() => {
          console.log('Login successful:', formValue);
          // Here you would typically navigate to the dashboard
          // this.router.navigate(['/dashboard']);
        }, 2000);

      } catch (error) {
        console.error('Login error:', error);
        this.loginError = 'خطأ في البريد الإلكتروني أو كلمة المرور. يرجى المحاولة مرة أخرى.';
        
        // Trigger shake animation
        if (isPlatformBrowser(this.platformId)) {
          const loginCard = document.querySelector('.login-card');
          if (loginCard) {
            loginCard.classList.add('shake-animation');
            setTimeout(() => {
              loginCard.classList.remove('shake-animation');
            }, 600);
          }
        }
      }
    } else {
      this.loginError = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح.';
      this.scrollToFirstError();
    }

    this.isLoading = false;
  }

  private async simulateLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const formValue = this.loginForm.value;
        // Simulate different responses based on email
        if (formValue.email === 'test@example.com' && formValue.password === '123456') {
          resolve();
        } else if (formValue.email.includes('admin')) {
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1500);
    });
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

  onFieldFocus(fieldName: string) {
    const field = this.loginForm.get(fieldName);
    if (field) {
      field.markAsTouched();
    }
    // Clear errors when user starts typing
    if (this.loginError) {
      this.loginError = '';
    }
  }

  // Social login methods
  loginWithGoogle() {
    if (isPlatformBrowser(this.platformId)) {
      // Simulate Google login
      console.log('Google login initiated');
      // Here you would integrate with Google OAuth
    }
  }

  loginWithFacebook() {
    if (isPlatformBrowser(this.platformId)) {
      // Simulate Facebook login
      console.log('Facebook login initiated');
      // Here you would integrate with Facebook login
    }
  }

  goToRegister() {
    // Navigate to register page
    console.log('Navigate to register');
    // this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    // Navigate to forgot password page
    console.log('Navigate to forgot password');
    // this.router.navigate(['/forgot-password']);
  }

  // Demo login methods
  demoLogin(userType: 'admin' | 'user') {
    if (userType === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@educational-initiative.org',
        password: 'admin123'
      });
    } else {
      this.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
    }
  }
}