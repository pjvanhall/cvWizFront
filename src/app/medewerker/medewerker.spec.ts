import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Medewerker } from './medewerker';
import { CvwizApiService } from '../cvwiz-api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MedewerkerDto, MedewerkerListDto } from '../cvwiz.models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Medewerker Component', () => {
  let component: Medewerker;
  let fixture: ComponentFixture<Medewerker>;
  let mockApiService: any;
  let mockDialog: any;
  let mockSnackBar: any;
  let mockRouter: any;

  const mockConsultants: MedewerkerListDto[] = [
    { id: '1', voornaam: 'Test', achternaam: 'User', emailAdres: 'test@test.com', hasCv: false }
  ];

  beforeEach(async () => {
    mockApiService = {
      getAllMedewerkers: jest.fn().mockReturnValue(of(mockConsultants)),
      deleteMedewerker: jest.fn().mockReturnValue(of(null)),
      getMedewerker: jest.fn()
    };

    mockDialog = {
      open: jest.fn()
    };

    mockSnackBar = {
      open: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    await TestBed.configureTestingModule({
      imports: [Medewerker, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .overrideComponent(Medewerker, {
      remove: { imports: [] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Medewerker);
    component = fixture.componentInstance;
    
    mockSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(mockSnackBar, 'open').mockImplementation();
    
    mockDialog = fixture.debugElement.injector.get(MatDialog);
    mockRouter = fixture.debugElement.injector.get(Router);
    jest.spyOn(mockRouter, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  it('should create and load consultants on init', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.getAllMedewerkers).toHaveBeenCalled();
    expect(component.consultants.data).toEqual(mockConsultants);
    expect(component.isBusy).toBe(false);
  });

  it('should handle load error', () => {
    mockApiService.getAllMedewerkers.mockReturnValue(throwError(() => new Error('API Error')));
    component.loadConsultants();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load consultants', 'Close', expect.any(Object));
    expect(component.isBusy).toBe(false);
  });

  describe('Dialogs', () => {
    let afterClosedSubject: Subject<any>;

    beforeEach(() => {
      afterClosedSubject = new Subject();
      jest.spyOn(mockDialog, 'open').mockReturnValue({
        afterClosed: () => afterClosedSubject.asObservable()
      } as any);
    });

    it('should open Add dialog and reload on success', () => {
      component.openAddDialog();
      expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ data: null }));

      mockApiService.getAllMedewerkers.mockClear();
      afterClosedSubject.next(true);
      expect(mockApiService.getAllMedewerkers).toHaveBeenCalled();
    });

    it('should not reload if Add dialog cancelled', () => {
      component.openAddDialog();
      mockApiService.getAllMedewerkers.mockClear();
      afterClosedSubject.next(false);
      expect(mockApiService.getAllMedewerkers).not.toHaveBeenCalled();
    });

    it('should open Edit dialog with data and reload on success', () => {
      component.openEditDialog(mockConsultants[0]);
      expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ data: mockConsultants[0] }));

      mockApiService.getAllMedewerkers.mockClear();
      afterClosedSubject.next(true);
      expect(mockApiService.getAllMedewerkers).toHaveBeenCalled();
    });
  });

  describe('Edit CV', () => {
    it('should fetch medewerker and navigate to existing CV', () => {
      const fullData: MedewerkerDto = { id: '1', voornaam: 'Test', achternaam: 'User', orgineleCv: { id: 99 } };
      mockApiService.getMedewerker.mockReturnValue(of(fullData));

      component.editCv(mockConsultants[0]);

      expect(mockApiService.getMedewerker).toHaveBeenCalledWith('1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cv'], { state: { id: 99, name: 'Test User' } });
      expect(component.isBusy).toBe(false);
    });

    it('should fetch medewerker and navigate to new CV (medewerkerId)', () => {
      const fullData: MedewerkerDto = { id: '1', voornaam: 'Test', achternaam: 'User' };
      mockApiService.getMedewerker.mockReturnValue(of(fullData));

      component.editCv(mockConsultants[0]);

      expect(mockApiService.getMedewerker).toHaveBeenCalledWith('1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cv'], { state: { medewerkerId: '1', name: 'Test User' } });
      expect(component.isBusy).toBe(false);
    });

    it('should handle getMedewerker error', () => {
      mockApiService.getMedewerker.mockReturnValue(throwError(() => new Error('Fetch error')));

      component.editCv(mockConsultants[0]);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to fetch consultant details.', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });

  describe('Delete', () => {
    it('should prompt and delete consultant', () => {
      component.deleteConsultant(mockConsultants[0]);
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure you want to delete consultant Test User?'));
      expect(mockApiService.deleteMedewerker).toHaveBeenCalledWith('Test', 'User');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Consultant deleted successfully', 'Close', expect.any(Object));
      expect(mockApiService.getAllMedewerkers).toHaveBeenCalledTimes(2);
    });

    it('should include warning if consultant has CV', () => {
      const consultantWithCv: MedewerkerListDto = { ...mockConsultants[0], hasCv: true };
      component.deleteConsultant(consultantWithCv);
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('WARNING: This consultant has a CV coupled.'));
    });

    it('should not delete if user cancels confirm', () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => false);
      mockApiService.deleteMedewerker.mockClear();
      
      component.deleteConsultant(mockConsultants[0]);
      expect(mockApiService.deleteMedewerker).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      mockApiService.deleteMedewerker.mockReturnValue(throwError(() => new Error('Delete Error')));
      
      component.deleteConsultant(mockConsultants[0]);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete Consultant', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });
});
