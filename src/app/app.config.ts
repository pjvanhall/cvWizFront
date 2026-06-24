import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Routes } from '@angular/router';

import { Medewerker } from './medewerker/medewerker';
import { Cv } from './cv/cv';
import { Beheerder } from './beheerder/beheerder';
import { Matrix } from './matrix/matrix';
import { authGuard } from './auth/auth.guard';
import { authInterceptor } from './auth/auth.interceptor';
import { LoginComponent } from './auth/login/login.component';
import { SocialAuthServiceConfig, GoogleLoginProvider, SOCIAL_AUTH_CONFIG } from '@abacritt/angularx-social-login';


const routes: Routes = [
  { path: '', redirectTo: 'medewerkers', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'medewerkers', component: Medewerker, canActivate: [authGuard] },
  { path: 'cv', component: Cv, canActivate: [authGuard] },
  { path: 'beheerders', component: Beheerder, canActivate: [authGuard] },
  { path: 'matrix', component: Matrix, canActivate: [authGuard] },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideRouter(routes),
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('975589662952-9g6899uf2uatfr8dprkgk6ql7c7kju4k.apps.googleusercontent.com')
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }
  ]
};
