import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface LoginRequestDto {
  username?: string;
  password?: string;
}

export interface LoginResponseDto {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/gebruikers';

  private readonly TOKEN_KEY = 'cvwiz_auth_token';

  // BehaviorSubject to track the authentication state reactively
  private authState = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.authState.asObservable();

  login(credentials: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.authState.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.authState.next(true);
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const isExpired = decoded.exp ? (decoded.exp * 1000) < Date.now() : true;
      if (isExpired) {
        localStorage.removeItem(this.TOKEN_KEY);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
