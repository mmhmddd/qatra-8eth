import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
    data: {
      title: 'قطرة غيث | من نحن - Qatrah Ghaith | About Us',
      meta: {
        description: 'مبادرة قطرة غيث غير ربحية لتعليم أطفال غزة والأمراض المزمنة عبر التعلم الإلكتروني في الأردن، فلسطين، مصر. Qatrah Ghaith non-profit for Gaza children education and chronic diseases e-learning in Jordan, Palestine, Egypt.',
        keywords: 'قطرة غيث, Qatrah Ghaith, تعليم إلكتروني, أطفال غزة, أمراض مزمنة, مبادرات تطوعية, الأردن, فلسطين, مصر, e-learning Gaza, chronic diseases education',
        ogTitle: 'قطرة غيث | من نحن - Qatrah Ghaith | About Us',
        ogDescription: 'اكتشف مبادرتنا التعليمية لأطفال غزة والأمراض المزمنة في الوطن العربي. Discover our non-profit e-learning initiative for Gaza children and chronic diseases in Arab world.',
        ogUrl: 'https://www.qatrah-ghaith.com/about',
        structuredData: {
          '@type': 'Organization',
          name: 'Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com',
          sameAs: [
            'https://www.facebook.com/groups/961087325615718',
            'https://x.com/QatrahGhaith',
            'https://www.instagram.com/qatrah_ghaith',
            'https://www.linkedin.com/company/qatrah-ghaith'
          ]
        }
      }
    }
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
    data: {
      title: 'قطرة غيث | تواصل معنا - Qatrah Ghaith | Contact Us',
      meta: {
        description: 'تواصل مع قطرة غيث لدعم مبادرات التعليم لأطفال غزة والأمراض المزمنة في الأردن، فلسطين، مصر. Contact Qatrah Ghaith for education support in Gaza children and chronic diseases in Jordan, Palestine, Egypt.',
        keywords: 'تواصل قطرة غيث, Qatrah Ghaith contact, دعم تعليمي, أطفال غزة, الأردن فلسطين مصر, e-learning support, Gaza education help',
        ogTitle: 'قطرة غيث | تواصل معنا - Qatrah Ghaith | Contact Us',
        ogDescription: 'انضم إلينا لدعم التعليم الإلكتروني في الوطن العربي. Join us to support e-learning in Arab countries.',
        ogUrl: 'https://www.qatrah-ghaith.com/contact',
        structuredData: {
          '@type': 'ContactPage',
          name: 'Contact Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/contact'
        }
      }
    }
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    data: {
      title: 'قطرة غيث | الصفحة الرئيسية - Qatrah Ghaith | Home',
      meta: {
        description: 'قطرة غيث: مبادرة تعليمية غير ربحية لأطفال غزة والأمراض المزمنة عبر التعلم الإلكتروني في الأردن، فلسطين، مصر والوطن العربي. Qatrah Ghaith: Non-profit e-learning for Gaza children and chronic diseases in Jordan, Palestine, Egypt and Arab world.',
        keywords: 'قطرة غيث, Qatrah Ghaith, تعليم أطفال غزة, أمراض مزمنة, تعلم إلكتروني, الأردن فلسطين مصر, e-learning Gaza, chronic diseases Jordan Palestine Egypt',
        ogTitle: 'قطرة غيث | الصفحة الرئيسية - Qatrah Ghaith | Home',
        ogDescription: 'انضم إلى مبادراتنا التعليمية لدعم أطفال غزة. Join our education initiatives for Gaza children.',
        ogUrl: 'https://www.qatrah-ghaith.com/home',
        structuredData: {
          '@type': 'WebSite',
          name: 'Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://www.qatrah-ghaith.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }
      }
    }
  },
  {
    path: 'join-us',
    loadComponent: () => import('./features/join-us/join-us.component').then(m => m.JoinUsComponent),
    data: {
      title: 'قطرة غيث | انضم إلينا - Qatrah Ghaith | Join Us',
      meta: {
        description: 'انضم إلى قطرة غيث كمتطوع أو متبرع لدعم تعليم أطفال غزة والأمراض المزمنة في الأردن، فلسطين، مصر. Join Qatrah Ghaith as volunteer or donor for Gaza children education in Jordan, Palestine, Egypt.',
        keywords: 'انضم قطرة غيث, Qatrah Ghaith join, تطوع تعليمي, أطفال غزة, أمراض مزمنة, الأردن فلسطين مصر, volunteer Gaza education',
        ogTitle: 'قطرة غيث | انضم إلينا - Qatrah Ghaith | Join Us',
        ogDescription: 'ساهم في مبادراتنا التطوعية للتعليم الإلكتروني. Contribute to our volunteer education programs.',
        ogUrl: 'https://www.qatrah-ghaith.com/join-us',
        structuredData: {
          '@type': 'VolunteerOpportunity',
          name: 'Join Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/join-us'
        }
      }
    }
  },
  {
    path: 'leaderboards',
    loadComponent: () => import('./features/leaderboards/leaderboards.component').then(m => m.LeaderboardsComponent),
    data: {
      title: 'قطرة غيث | قوائم التصنيف - Qatrah Ghaith | Leaderboards',
      meta: {
        description: 'شاهد قوائم التصنيف في قطرة غيث لمبادرات التعليم لأطفال غزة والأمراض المزمنة في الأردن، فلسطين، مصر. View Qatrah Ghaith leaderboards for Gaza education and chronic diseases in Jordan, Palestine, Egypt.',
        keywords: 'قوائم تصنيف قطرة غيث, Qatrah Ghaith leaderboards, تعليم غزة, أمراض مزمنة, الأردن فلسطين مصر, education rankings Gaza',
        ogTitle: 'قطرة غيث | قوائم التصنيف - Qatrah Ghaith | Leaderboards',
        ogDescription: 'اكتشف أفضل المساهمين في مبادراتنا التعليمية. Discover top contributors in our education initiatives.',
        ogUrl: 'https://www.qatrah-ghaith.com/leaderboards',
        structuredData: {
          '@type': 'Article',
          headline: 'Leaderboards in Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/leaderboards'
        }
      }
    }
  },
  {
    path: 'testimonials',
    loadComponent: () => import('./features/testimonials/testimonials.component').then(m => m.TestimonialsComponent),
    data: {
      title: 'قطرة غيث | شهادات - Qatrah Ghaith | Testimonials',
      meta: {
        description: 'اقرأ شهادات المشاركين في قطرة غيث حول تعليم أطفال غزة والأمراض المزمنة في الأردن، فلسطين، مصر. Read Qatrah Ghaith testimonials on Gaza children education in Jordan, Palestine, Egypt.',
        keywords: 'شهادات قطرة غيث, Qatrah Ghaith testimonials, تعليم غزة, أمراض مزمنة, الأردن فلسطين مصر, Gaza education stories',
        ogTitle: 'قطرة غيث | شهادات - Qatrah Ghaith | Testimonials',
        ogDescription: 'قصص نجاح من مبادراتنا التعليمية. Success stories from our education programs.',
        ogUrl: 'https://www.qatrah-ghaith.com/testimonials',
        structuredData: {
          '@type': 'Review',
          name: 'Testimonials for Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/testimonials'
        }
      }
    }
  },
  {
    path: 'last-news',
    loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent),
    data: {
      title: 'قطرة غيث | آخر الأخبار - Qatrah Ghaith | Last News',
      meta: {
        description: 'تابع آخر أخبار قطرة غيث حول مبادرات التعليم لأطفال غزة والأمراض المزمنة في الأردن، فلسطين، مصر. Follow Qatrah Ghaith latest news on Gaza education in Jordan, Palestine, Egypt.',
        keywords: 'أخبار قطرة غيث, Qatrah Ghaith news, تعليم غزة, أمراض مزمنة, الأردن فلسطين مصر, Gaza education updates',
        ogTitle: 'قطرة غيث | آخر الأخبار - Qatrah Ghaith | Last News',
        ogDescription: 'أحدث التطورات في مبادراتنا التعليمية. Latest updates on our education initiatives.',
        ogUrl: 'https://www.qatrah-ghaith.com/last-news',
        structuredData: {
          '@type': 'NewsArticle',
          headline: 'Last News from Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/last-news'
        }
      }
    }
  },
  {
    path: 'library',
    loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent),
    data: {
      title: 'قطرة غيث | المكتبة - Qatrah Ghaith | Library',
      meta: {
        description: 'استكشف مكتبة قطرة غيث لموارد التعليم الإلكتروني لأطفال غزة والأمراض المزمنة في الأردن، فلسطين، مصر. Explore Qatrah Ghaith library for e-learning resources in Gaza, Jordan, Palestine, Egypt.',
        keywords: 'مكتبة قطرة غيث, Qatrah Ghaith library, موارد تعليمية غزة, أمراض مزمنة, الأردن فلسطين مصر, e-learning resources Gaza',
        ogTitle: 'قطرة غيث | المكتبة - Qatrah Ghaith | Library',
        ogDescription: 'موارد تعليمية مجانية للأطفال والمبادرات. Free education resources for children initiatives.',
        ogUrl: 'https://www.qatrah-ghaith.com/library',
        structuredData: {
          '@type': 'CollectionPage',
          name: 'Library of Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/library'
        }
      }
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'قطرة غيث | تسجيل الدخول - Qatrah Ghaith | Login',
      meta: {
        description: 'تسجيل الدخول إلى قطرة غيث للوصول إلى مبادرات التعليم لأطفال غزة في الأردن، فلسطين، مصر. Login to Qatrah Ghaith for Gaza education access in Jordan, Palestine, Egypt.',
        keywords: 'تسجيل دخول قطرة غيث, Qatrah Ghaith login, تعليم غزة, الأردن فلسطين مصر, Gaza education login',
        ogTitle: 'قطرة غيث | تسجيل الدخول - Qatrah Ghaith | Login',
        ogDescription: 'ادخل لحسابك للمساهمة في المبادرات التعليمية. Access your account for education contributions.',
        ogUrl: 'https://www.qatrah-ghaith.com/login',
        structuredData: {
          '@type': 'WebPage',
          name: 'Login to Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/login'
        }
      }
    }
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard],
    data: {
      title: 'قطرة غيث | الملف الشخصي - Qatrah Ghaith | Profile',
      meta: {
        description: 'إدارة ملفك الشخصي في قطرة غيث لمبادرات التعليم لأطفال غزة والأمراض المزمنة. Manage your Qatrah Ghaith profile for Gaza education initiatives.',
        keywords: 'ملف شخصي قطرة غيث, Qatrah Ghaith profile, تعليم غزة, أمراض مزمنة, الأردن فلسطين مصر, Gaza education profile',
        ogTitle: 'قطرة غيث | الملف الشخصي - Qatrah Ghaith | Profile',
        ogDescription: 'شاهد مساهمتك في مبادرات التعليم. View your contributions in education programs.',
        ogUrl: 'https://www.qatrah-ghaith.com/profile',
        structuredData: {
          '@type': 'ProfilePage',
          name: 'User Profile in Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/profile'
        }
      }
    }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./shared/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: {
      title: 'قطرة غيث | نسيت كلمة المرور - Qatrah Ghaith | Forgot Password',
      meta: {
        description: 'استعادة كلمة المرور في قطرة غيث للوصول إلى مبادرات التعليم لأطفال غزة. Recover password for Qatrah Ghaith Gaza education access.',
        keywords: 'نسيت كلمة مرور قطرة غيث, Qatrah Ghaith forgot password, تعليم غزة, الأردن فلسطين مصر, Gaza education recovery',
        ogTitle: 'قطرة غيث | نسيت كلمة المرور - Qatrah Ghaith | Forgot Password',
        ogDescription: 'استعد حسابك لدعم المبادرات التعليمية. Recover your account for education support.',
        ogUrl: 'https://www.qatrah-ghaith.com/forgot-password',
        structuredData: {
          '@type': 'WebPage',
          name: 'Forgot Password for Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/forgot-password'
        }
      }
    }
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./shared/reset-password-component/reset-password-component.component').then(m => m.ResetPasswordComponent),
    data: {
      title: 'قطرة غيث | إعادة تعيين كلمة المرور - Qatrah Ghaith | Reset Password',
      meta: {
        description: 'إعادة تعيين كلمة المرور في قطرة غيث لمبادرات تعليم أطفال غزة. Reset password for Qatrah Ghaith Gaza education initiatives.',
        keywords: 'إعادة تعيين كلمة مرور قطرة غيث, Qatrah Ghaith reset password, تعليم غزة, الأردن فلسطين مصر, Gaza education reset',
        ogTitle: 'قطرة غيث | إعادة تعيين كلمة المرور - Qatrah Ghaith | Reset Password',
        ogDescription: 'أعد تعيين حسابك للمساهمة في التعليم. Reset your account for education contributions.',
        ogUrl: 'https://www.qatrah-ghaith.com/reset-password',
        structuredData: {
          '@type': 'WebPage',
          name: 'Reset Password for Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/reset-password'
        }
      }
    }
  },
  {
    path: 'drive-lecture',
    loadComponent: () => import('./dashboard/drive-lecture/drive-lecture.component').then(m => m.DriveLectureComponent)
  },
  {
    path: 'tree',
    loadComponent: () => import('./features/tree/tree.component').then(m => m.TreeComponent),
    data: {
      title: 'قطرة غيث | الشجرة - Qatrah Ghaith | Tree',
      meta: {
        description: 'استكشف شجرة المعرفة في قطرة غيث لتعليم أطفال غزة والأمراض المزمنة. Explore Qatrah Ghaith knowledge tree for Gaza children education.',
        keywords: 'شجرة قطرة غيث, Qatrah Ghaith tree, تعليم غزة, أمراض مزمنة, الأردن فلسطين مصر, Gaza education tree',
        ogTitle: 'قطرة غيث | الشجرة - Qatrah Ghaith | Tree',
        ogDescription: 'بناء المعرفة لمبادرات التعليم. Building knowledge for education initiatives.',
        ogUrl: 'https://www.qatrah-ghaith.com/tree',
        structuredData: {
          '@type': 'WebPage',
          name: 'Tree in Qatrah Ghaith',
          url: 'https://www.qatrah-ghaith.com/tree'
        }
      }
    }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'all-join-request',
    loadComponent: () => import('./dashboard/all-join-request/all-join-request.component').then(m => m.AllJoinRequestComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'all-members',
    loadComponent: () => import('./dashboard/all-members/all-members.component').then(m => m.AllMembersComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'member/:id',
    loadComponent: () => import('./dashboard/show-member/show-member.component').then(m => m.ShowMemberComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'lectures-request',
    loadComponent: () => import('./dashboard/lectures-request/lectures-request.component').then(m => m.LecturesRequestComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'add-leaderboards',
    loadComponent: () => import('./dashboard/add-leaderboards/add-leaderboards.component').then(m => m.AddLeaderboardsComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'add-testimonials',
    loadComponent: () => import('./dashboard/add-testimonials/add-testimonials.component').then(m => m.AddTestimonialsComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'add-gallery',
    loadComponent: () => import('./dashboard/add-gallery/add-gallery.component').then(m => m.AddGalleryComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'upload-pdf',
    loadComponent: () => import('./dashboard/upload-pdf/upload-pdf.component').then(m => m.UploadPdfComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'low-lecture-members',
    loadComponent: () => import('./dashboard/low-lecture-members/low-lecture-members.component').then(m => m.LowLectureMembersComponent)
  },
  {
    path: 'statistics',
    loadComponent: () => import('./dashboard/statistics/statistics.component').then(m => m.StatisticsComponent)
  },
  {
    path: 'join-massege',
    loadComponent: () => import('./dashboard/join-massege/join-massege.component').then(m => m.JoinMessageComponent)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
