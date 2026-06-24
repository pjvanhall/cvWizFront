import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { SocialAuthService } from '@abacritt/angularx-social-login';

export interface LoginRequestDto {
  username?: string;
  password?: string;
}

export interface LoginResponseDto {
  username: string;
  name: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly socialAuthService = inject(SocialAuthService);
  private readonly baseUrl = '/api/gebruikers';

  private readonly USER_INFO_KEY = 'cvwiz_user_info';

  // BehaviorSubject to track the authentication state reactively
  private authState = new BehaviorSubject<boolean>(this.hasUserInfo());
  public isAuthenticated$ = this.authState.asObservable();

  login(credentials: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.baseUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((response) => {
        this.setUserInfo(response);
      })
    );
  }

  loginWithGoogle(idToken: string): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.baseUrl}/google-login`, { idToken }, { withCredentials: true }).pipe(
      tap((response) => {
        this.setUserInfo(response);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearLocalState(),
      error: () => this.clearLocalState()
    });
  }

  private clearLocalState(): void {
    localStorage.removeItem(this.USER_INFO_KEY);
    this.authState.next(false);
    
    try {
      this.socialAuthService.signOut().catch(() => {
        // Ignore error if user is not signed in with Google
      });
    } catch (e) {
      // Ignore synchronous errors
    }
  }

  private setUserInfo(response: LoginResponseDto): void {
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(response));
    this.authState.next(true);
  }

  isAuthenticated(): boolean {
    return this.hasUserInfo();
  }

  private hasUserInfo(): boolean {
    return !!localStorage.getItem(this.USER_INFO_KEY);
  }

  private getUserInfo(): LoginResponseDto | null {
    const info = localStorage.getItem(this.USER_INFO_KEY);
    if (!info) return null;
    try {
      return JSON.parse(info);
    } catch {
      return null;
    }
  }

  getRoles(): string[] {
    const info = this.getUserInfo();
    return info ? info.roles : [];
  }

  getUsername(): string {
    const info = this.getUserInfo();
    return info ? info.username : '';
  }

  getName(): string {
    const info = this.getUserInfo();
    return info ? (info.name || info.username) : '';
  }

  getEmail(): string {
    const info = this.getUserInfo();
    return info ? info.email : '';
  }
}
