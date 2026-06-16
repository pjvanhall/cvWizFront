import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Routes } from '@angular/router';

import { Medewerker } from './medewerker/medewerker';
import { Cv } from './cv/cv';
import { Beheerder } from './beheerder/beheerder';
import { Matrix } from './matrix/matrix';

const routes: Routes = [
  { path: '', redirectTo: 'medewerkers', pathMatch: 'full' },
  { path: 'medewerkers', component: Medewerker },
  { path: 'cv', component: Cv },
  { path: 'beheerders', component: Beheerder },
  { path: 'matrix', component: Matrix },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideRouter(routes)
  ]
};
