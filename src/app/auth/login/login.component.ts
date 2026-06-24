import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../auth.service';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressBarModule,
    GoogleSigninButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly socialAuthService = inject(SocialAuthService);
  private authSubscription?: Subscription;

  isBusy = false;

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    this.authSubscription = this.socialAuthService.authState.subscribe((user) => {
      if (user && user.idToken) {
        this.isBusy = true;
        this.authService.loginWithGoogle(user.idToken).subscribe({
          next: () => {
            this.isBusy = false;
            this.snackBar.open('Google Login successful', 'Close', { duration: 3000 });
            
            if (this.authService.getRoles().includes('ROLE_CONSULTANT') && this.authService.getRoles().length === 1) {
              this.router.navigate(['/cv'], { queryParams: { isOwn: true } });
            } else {
              this.router.navigate(['/medewerkers']);
            }
          },
          error: (err) => {
            this.isBusy = false;
            this.snackBar.open(err?.error?.message || 'Google Login failed. You might not have an account.', 'Close', { duration: 5000 });
            this.socialAuthService.signOut().catch(() => {});
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isBusy = true;
    const { username, password } = this.loginForm.getRawValue();

    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.isBusy = false;
        this.snackBar.open('Login successful', 'Close', { duration: 3000 });
        
        if (this.authService.getRoles().includes('ROLE_CONSULTANT') && this.authService.getRoles().length === 1) {
          this.router.navigate(['/cv'], { queryParams: { isOwn: true } });
        } else {
          this.router.navigate(['/medewerkers']);
        }
      },
      error: () => {
        this.isBusy = false;
        this.snackBar.open('Login failed. Check your credentials.', 'Close', { duration: 5000 });
      }
    });
  }
}
