import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Beheerder } from './beheerder';
import { CvwizApiService } from '../cvwiz-api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { BeheerderDto } from '../cvwiz.models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Beheerder Component', () => {
  let component: Beheerder;
  let fixture: ComponentFixture<Beheerder>;
  let mockApiService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  const mockBeheerders: BeheerderDto[] = [
    { id: '1', voornaam: 'Admin', achternaam: 'One', emailAdres: 'admin1@test.com', hasCv: false }
  ];

  beforeEach(async () => {
    mockApiService = {
      getAllBeheerders: jest.fn().mockReturnValue(of(mockBeheerders)),
      deleteBeheerder: jest.fn().mockReturnValue(of(null))
    };

    mockDialog = {
      open: jest.fn()
    };

    mockSnackBar = {
      open: jest.fn()
    };

    // To mock window.confirm
    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    await TestBed.configureTestingModule({
      imports: [Beheerder, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .overrideComponent(Beheerder, {
      remove: { imports: [] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Beheerder);
    component = fixture.componentInstance;
    
    // For standalone components importing MatSnackBar/MatDialog
    // Sometimes we need to overwrite from the injector directly
    mockSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(mockSnackBar, 'open').mockImplementation();
    
    mockDialog = fixture.debugElement.injector.get(MatDialog);

    fixture.detectChanges();
  });

  it('should create and load beheerders on init', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.getAllBeheerders).toHaveBeenCalled();
    expect(component.beheerders.data).toEqual(mockBeheerders);
    expect(component.isBusy).toBe(false);
  });

  it('should handle load error', () => {
    mockApiService.getAllBeheerders.mockReturnValue(throwError(() => new Error('API Error')));
    component.loadBeheerders();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load managers', 'Close', expect.any(Object));
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

      mockApiService.getAllBeheerders.mockClear();
      afterClosedSubject.next(true); // User added successfully
      expect(mockApiService.getAllBeheerders).toHaveBeenCalled();
    });

    it('should not reload if Add dialog cancelled', () => {
      component.openAddDialog();
      mockApiService.getAllBeheerders.mockClear();
      afterClosedSubject.next(false); // User cancelled
      expect(mockApiService.getAllBeheerders).not.toHaveBeenCalled();
    });

    it('should open Edit dialog with data and reload on success', () => {
      component.openEditDialog(mockBeheerders[0]);
      expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ data: mockBeheerders[0] }));

      mockApiService.getAllBeheerders.mockClear();
      afterClosedSubject.next(true);
      expect(mockApiService.getAllBeheerders).toHaveBeenCalled();
    });
  });

  describe('Delete', () => {
    it('should prompt and delete beheerder', () => {
      component.deleteBeheerder(mockBeheerders[0]);
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure you want to delete manager Admin One?'));
      expect(mockApiService.deleteBeheerder).toHaveBeenCalledWith('1');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Manager deleted successfully', 'Close', expect.any(Object));
      expect(mockApiService.getAllBeheerders).toHaveBeenCalledTimes(2); // Once on init, once on delete
    });

    it('should include warning if beheerder has CV', () => {
      const beheerderWithCv: BeheerderDto = { ...mockBeheerders[0], hasCv: true };
      component.deleteBeheerder(beheerderWithCv);
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('WARNING: This manager is also a consultant'));
    });

    it('should not delete if user cancels confirm', () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => false);
      mockApiService.deleteBeheerder.mockClear();
      
      component.deleteBeheerder(mockBeheerders[0]);
      expect(mockApiService.deleteBeheerder).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      mockApiService.deleteBeheerder.mockReturnValue(throwError(() => new Error('Delete Error')));
      
      component.deleteBeheerder(mockBeheerders[0]);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete Manager', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });
});
