import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedewerkerDetailDialogComponent } from './medewerker-detail-dialog.component';
import { CvwizApiService } from '../../cvwiz-api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MedewerkerDetailDialogComponent', () => {
  let component: MedewerkerDetailDialogComponent;
  let fixture: ComponentFixture<MedewerkerDetailDialogComponent>;
  let mockApiService: any;
  let mockDialogRef: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockApiService = {
      createMedewerker: jest.fn().mockReturnValue(of({})),
      updateMedewerker: jest.fn().mockReturnValue(of({})),
      deleteMedewerker: jest.fn().mockReturnValue(of({}))
    };

    mockDialogRef = {
      close: jest.fn()
    };

    mockSnackBar = {
      open: jest.fn()
    };

    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    await TestBed.configureTestingModule({
      imports: [MedewerkerDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    })
    .overrideComponent(MedewerkerDetailDialogComponent, {
      remove: { imports: [] }
    })
    .compileComponents();
  });

  function createComponent(data: any = null) {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(MedewerkerDetailDialogComponent);
    component = fixture.componentInstance;
    
    mockSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(mockSnackBar, 'open').mockImplementation();

    fixture.detectChanges();
  }

  describe('Create Mode', () => {
    beforeEach(() => {
      createComponent(null);
    });

    it('should create empty form', () => {
      expect(component.medewerkerForm.value).toEqual({
        id: '',
        voornaam: '',
        achternaam: '',
        telefoon: '',
        emailAdres: ''
      });
    });

    it('should patch form with empty strings if data has missing properties', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MedewerkerDetailDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: CvwizApiService, useValue: mockApiService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: {} as any }
        ]
      });
      const newFixture = TestBed.createComponent(MedewerkerDetailDialogComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      
      expect(newComponent.medewerkerForm.value).toEqual({
        id: '',
        voornaam: '',
        achternaam: '',
        telefoon: '',
        emailAdres: ''
      });
    });

    it('should close on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not save if form is invalid', () => {
      component.onSave();
      expect(mockApiService.createMedewerker).not.toHaveBeenCalled();
      expect(component.medewerkerForm.touched).toBe(true);
    });

    it('should call createMedewerker on save and close dialog', () => {
      component.medewerkerForm.setValue({
        id: '',
        voornaam: 'Test',
        achternaam: 'User',
        telefoon: '123',
        emailAdres: 'test@test.com'
      });

      component.onSave();

      expect(mockApiService.createMedewerker).toHaveBeenCalledWith(expect.objectContaining({
        voornaam: 'Test',
        achternaam: 'User',
        telefoon: '123',
        emailAdres: 'test@test.com'
      }));
      expect(mockSnackBar.open).toHaveBeenCalledWith('Consultant created successfully', 'Close', expect.any(Object));
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      mockApiService.createMedewerker.mockReturnValue(throwError(() => new Error('Create error')));
      
      component.medewerkerForm.setValue({
        id: '',
        voornaam: 'Test',
        achternaam: 'User',
        telefoon: '123',
        emailAdres: 'test@test.com'
      });

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to create Consultant', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });

  describe('Edit Mode', () => {
    const existingData = {
      id: '1',
      voornaam: 'John',
      achternaam: 'Doe',
      telefoon: '987',
      emailAdres: 'john@doe.com',
      orgineleCv: { id: 1 }
    };

    beforeEach(() => {
      createComponent(existingData);
    });

    it('should patch form with existing data', () => {
      expect(component.medewerkerForm.value).toEqual({
        id: '1',
        voornaam: 'John',
        achternaam: 'Doe',
        telefoon: '987',
        emailAdres: 'john@doe.com'
      });
    });

    it('should call updateMedewerker on save', () => {
      component.medewerkerForm.patchValue({ voornaam: 'Jane' });
      component.onSave();

      expect(mockApiService.updateMedewerker).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        voornaam: 'Jane',
        achternaam: 'Doe',
        orgineleCv: { id: 1 }
      }));
      expect(mockSnackBar.open).toHaveBeenCalledWith('Consultant updated successfully', 'Close', expect.any(Object));
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should handle update error', () => {
      mockApiService.updateMedewerker.mockReturnValue(throwError(() => new Error('Update err')));
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update Consultant', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });

    it('should call deleteMedewerker on delete', () => {
      component.onDelete();

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure you want to delete consultant John Doe?'));
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('WARNING: This consultant has a CV coupled.'));
      expect(mockApiService.deleteMedewerker).toHaveBeenCalledWith('John', 'Doe');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Consultant deleted successfully', 'Close', expect.any(Object));
      expect(mockDialogRef.close).toHaveBeenCalledWith('deleted');
    });

    it('should prompt without warning if orgineleCv is missing', () => {
      component.data = { ...existingData, orgineleCv: undefined } as any;
      component.onDelete();
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete consultant John Doe?');
      expect(mockApiService.deleteMedewerker).toHaveBeenCalledWith('John', 'Doe');
    });

    it('should handle delete with missing names', () => {
      component.data = { ...existingData, voornaam: undefined, achternaam: undefined } as any;
      component.onDelete();
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete consultant undefined undefined?\n\nWARNING: This consultant has a CV coupled. Deleting this consultant will also permanently delete their CV and skill matrix!');
      expect(mockApiService.deleteMedewerker).toHaveBeenCalledWith('', '');
    });

    it('should handle delete cancellation', () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => false);
      component.onDelete();

      expect(mockApiService.deleteMedewerker).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      mockApiService.deleteMedewerker.mockReturnValue(throwError(() => new Error('Delete err')));
      component.onDelete();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete Consultant', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should do nothing on delete if no data', () => {
      createComponent(null);
      component.onDelete();
      expect(mockApiService.deleteMedewerker).not.toHaveBeenCalled();
    });
  });
});
