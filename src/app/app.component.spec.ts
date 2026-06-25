import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockAuthService: any;
  let authState$: BehaviorSubject<boolean>;
  let router: Router;

  beforeEach(async () => {
    authState$ = new BehaviorSubject<boolean>(false);

    mockAuthService = {
      isAuthenticated$: authState$.asObservable(),
      getRoles: jest.fn().mockReturnValue([]),
      getName: jest.fn().mockReturnValue('Test User'),
      getEmail: jest.fn().mockReturnValue('test@example.com'),
      logout: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('isOnlyConsultant', () => {
    it('should return true if user ONLY has ROLE_CONSULTANT', () => {
      mockAuthService.getRoles.mockReturnValue(['ROLE_CONSULTANT']);
      expect(component.isOnlyConsultant).toBe(true);
    });

    it('should return false if user has ROLE_CONSULTANT and other roles', () => {
      mockAuthService.getRoles.mockReturnValue(['ROLE_CONSULTANT', 'ROLE_ADMIN']);
      expect(component.isOnlyConsultant).toBe(false);
    });

    it('should return false if user does not have ROLE_CONSULTANT', () => {
      mockAuthService.getRoles.mockReturnValue(['ROLE_ADMIN']);
      expect(component.isOnlyConsultant).toBe(false);
    });
  });

  describe('Getters', () => {
    it('should return name from auth service', () => {
      expect(component.name).toBe('Test User');
      expect(mockAuthService.getName).toHaveBeenCalled();
    });

    it('should return email from auth service', () => {
      expect(component.email).toBe('test@example.com');
      expect(mockAuthService.getEmail).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to /login', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Template rendering', () => {
    it('should show unauthenticated template when not logged in', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.unauthenticated-container')).toBeTruthy();
      expect(compiled.querySelector('.app-sidenav-container')).toBeFalsy();
    });

    it('should show sidenav when logged in', () => {
      authState$.next(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.app-sidenav-container')).toBeTruthy();
      expect(compiled.querySelector('.unauthenticated-container')).toBeFalsy();
    });
  });
});
