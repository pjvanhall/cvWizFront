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
import { FirstloginComponent } from './auth/firstlogin/firstlogin.component';


const routes: Routes = [
  { path: '', redirectTo: 'medewerkers', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'firstlogin', component: FirstloginComponent, canActivate: [authGuard] },
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
    provideRouter(routes)
  ]
};
