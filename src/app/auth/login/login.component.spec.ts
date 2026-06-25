import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialAuthService, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let mockSocialAuthService: any;
  let authState$: BehaviorSubject<any>;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    authState$ = new BehaviorSubject<any>(null);

    mockAuthService = {
      login: jest.fn().mockReturnValue(of({})),
      loginWithGoogle: jest.fn().mockReturnValue(of({})),
      getRoles: jest.fn().mockReturnValue(['ROLE_USER'])
    };

    mockSocialAuthService = {
      authState: authState$.asObservable(),
      initState: of(true),
      refreshAuthToken: jest.fn().mockReturnValue(of(null)),
      signOut: jest.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: SocialAuthService, useValue: mockSocialAuthService },
        {
          provide: 'SocialAuthServiceConfig',
          useValue: {
            autoLogin: false,
            providers: []
          } as SocialAuthServiceConfig
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    
    router = fixture.debugElement.injector.get(Router);
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    jest.spyOn(snackBar, 'open').mockImplementation();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Standard Login', () => {
    it('should not call authService.login if form is invalid', () => {
      component.loginForm.controls.username.setValue('');
      component.login();
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should call authService.login and navigate to /medewerkers for non-consultants', () => {
      mockAuthService.getRoles.mockReturnValue(['ROLE_ADMIN']);
      component.loginForm.setValue({ username: 'testuser', password: 'testpassword' });
      
      component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'testpassword' });
      expect(snackBar.open).toHaveBeenCalledWith('Login successful', 'Close', expect.any(Object));
      expect(router.navigate).toHaveBeenCalledWith(['/medewerkers']);
    });

    it('should navigate to /cv if user is ONLY a consultant', () => {
      mockAuthService.getRoles.mockReturnValue(['ROLE_CONSULTANT']);
      component.loginForm.setValue({ username: 'testuser', password: 'testpassword' });
      
      component.login();

      expect(router.navigate).toHaveBeenCalledWith(['/cv'], { queryParams: { isOwn: true } });
    });

    it('should show error snackbar on login failure', () => {
      mockAuthService.login.mockReturnValue(throwError(() => new Error('Login failed')));
      component.loginForm.setValue({ username: 'testuser', password: 'testpassword' });
      
      component.login();

      expect(snackBar.open).toHaveBeenCalledWith('Login failed. Check your credentials.', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });

  describe('Google Login', () => {
    it('should trigger loginWithGoogle when socialAuthService emits valid user', () => {
      mockAuthService.getRoles.mockReturnValue(['ROLE_ADMIN']);
      
      // Simulate Google auth success
      authState$.next({ idToken: 'test-google-token' });

      expect(mockAuthService.loginWithGoogle).toHaveBeenCalledWith('test-google-token');
      expect(snackBar.open).toHaveBeenCalledWith('Google Login successful', 'Close', expect.any(Object));
      expect(router.navigate).toHaveBeenCalledWith(['/medewerkers']);
    });

    it('should handle Google login failure and show snackbar', () => {
      mockAuthService.loginWithGoogle.mockReturnValue(throwError(() => ({ error: { message: 'Google error' } })));
      
      authState$.next({ idToken: 'test-google-token' });

      expect(snackBar.open).toHaveBeenCalledWith('Google error', 'Close', expect.any(Object));
      expect(mockSocialAuthService.signOut).toHaveBeenCalled();
    });
  });
});
