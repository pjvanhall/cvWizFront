import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: jest.fn()
    };
    
    mockRouter = {
      createUrlTree: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  const runGuard = () => {
    return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  };

  it('should return true if user is authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should return UrlTree to /login if user is not authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockRouter.createUrlTree.mockReturnValue('mockUrlTree');
    
    const result = runGuard();
    
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe('mockUrlTree');
  });
});
