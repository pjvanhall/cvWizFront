import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginRequestDto, LoginResponseDto } from './auth.service';
import { SocialAuthService } from '@abacritt/angularx-social-login';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockSocialAuthService: any;

  const mockUserInfo: LoginResponseDto = {
    username: 'johndoe',
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['ROLE_USER', 'ROLE_ADMIN']
  };

  beforeEach(() => {
    mockSocialAuthService = {
      signOut: jest.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: SocialAuthService, useValue: mockSocialAuthService }
      ]
    });
    
    // Clear localStorage before each test
    localStorage.clear();

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Login & Logout', () => {
    it('should POST to login and set user info', () => {
      const creds: LoginRequestDto = { username: 'johndoe', password: 'password123' };
      
      service.login(creds).subscribe(response => {
        expect(response).toEqual(mockUserInfo);
      });

      const req = httpMock.expectOne('/api/gebruikers/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(creds);
      expect(req.request.withCredentials).toBe(true);
      
      req.flush(mockUserInfo);

      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('cvwiz_user_info')).toEqual(JSON.stringify(mockUserInfo));
    });

    it('should POST to google-login and set user info', () => {
      service.loginWithGoogle('google-token-123').subscribe(response => {
        expect(response).toEqual(mockUserInfo);
      });

      const req = httpMock.expectOne('/api/gebruikers/google-login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ idToken: 'google-token-123' });
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockUserInfo);

      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('cvwiz_user_info')).toEqual(JSON.stringify(mockUserInfo));
    });

    it('should POST to logout and clear local state on success', () => {
      // Setup authenticated state first
      localStorage.setItem('cvwiz_user_info', JSON.stringify(mockUserInfo));
      
      // Need a new service instance to pick up the localStorage value in its BehaviorSubject initialization
      const testService = TestBed.inject(AuthService);
      expect(testService.isAuthenticated()).toBe(true);

      testService.logout();

      const req = httpMock.expectOne('/api/gebruikers/logout');
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(testService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('cvwiz_user_info')).toBeNull();
      expect(mockSocialAuthService.signOut).toHaveBeenCalled();
    });

    it('should POST to logout and clear local state even on error', () => {
      localStorage.setItem('cvwiz_user_info', JSON.stringify(mockUserInfo));
      const testService = TestBed.inject(AuthService);

      testService.logout();

      const req = httpMock.expectOne('/api/gebruikers/logout');
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(testService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('cvwiz_user_info')).toBeNull();
      expect(mockSocialAuthService.signOut).toHaveBeenCalled();
    });
  });

  describe('User Info Getters', () => {
    it('should return empty values when not authenticated', () => {
      expect(service.getRoles()).toEqual([]);
      expect(service.getUsername()).toBe('');
      expect(service.getName()).toBe('');
      expect(service.getEmail()).toBe('');
    });

    it('should return empty values when localStorage is invalid JSON', () => {
      localStorage.setItem('cvwiz_user_info', 'invalid-json');
      expect(service.getRoles()).toEqual([]);
    });

    it('should return correct values when authenticated', () => {
      localStorage.setItem('cvwiz_user_info', JSON.stringify(mockUserInfo));
      
      expect(service.getRoles()).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
      expect(service.getUsername()).toBe('johndoe');
      expect(service.getName()).toBe('John Doe');
      expect(service.getEmail()).toBe('john@example.com');
    });

    it('should fallback name to username if name is missing', () => {
      const noNameInfo: LoginResponseDto = {
        username: 'johndoe',
        name: '',
        email: 'john@example.com',
        roles: []
      };
      localStorage.setItem('cvwiz_user_info', JSON.stringify(noNameInfo));
      
      expect(service.getName()).toBe('johndoe');
    });
  });

  describe('Authentication State', () => {
    it('isAuthenticated$ should emit true when login occurs', (done) => {
      service.isAuthenticated$.subscribe(isAuth => {
        if (isAuth) {
          expect(isAuth).toBe(true);
          done();
        }
      });

      service.login({ username: 'test' }).subscribe();
      const req = httpMock.expectOne('/api/gebruikers/login');
      req.flush(mockUserInfo);
    });
  });
});
