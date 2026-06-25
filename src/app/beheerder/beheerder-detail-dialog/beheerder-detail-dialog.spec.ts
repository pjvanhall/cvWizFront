import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BeheerderDetailDialogComponent } from './beheerder-detail-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CvwizApiService } from '../../cvwiz-api.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('BeheerderDetailDialogComponent', () => {
  let component: BeheerderDetailDialogComponent;
  let fixture: ComponentFixture<BeheerderDetailDialogComponent>;
  let mockApiService: any;
  let mockDialogRef: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockApiService = {
      createBeheerder: jest.fn().mockReturnValue(of({})),
      updateBeheerder: jest.fn().mockReturnValue(of({})),
      deleteBeheerder: jest.fn().mockReturnValue(of({}))
    };

    mockDialogRef = {
      close: jest.fn()
    };

    mockSnackBar = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BeheerderDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeheerderDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values when data is null', () => {
    expect(component.beheerderForm.value).toEqual({
      id: '',
      voornaam: '',
      achternaam: '',
      telefoon: '',
      emailAdres: ''
    });
  });

  it('should patch form values when data is provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BeheerderDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: {
            id: '123',
            voornaam: 'John',
            achternaam: 'Doe',
            telefoon: '1234567890',
            emailAdres: 'john@example.com',
            hasCv: false
          } 
        }
      ]
    });
    
    const newFixture = TestBed.createComponent(BeheerderDetailDialogComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.beheerderForm.value).toEqual({
      id: '123',
      voornaam: 'John',
      achternaam: 'Doe',
      telefoon: '1234567890',
      emailAdres: 'john@example.com'
    });
  });

  it('should call close on dialog when onCancel is called', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should not call api if form is invalid on save', () => {
    component.beheerderForm.controls.voornaam.setValue(''); // Invalid because required
    component.onSave();
    expect(mockApiService.createBeheerder).not.toHaveBeenCalled();
    expect(mockApiService.updateBeheerder).not.toHaveBeenCalled();
  });

  it('should call createBeheerder when form is valid and no id exists', () => {
    component.beheerderForm.patchValue({
      voornaam: 'John',
      achternaam: 'Doe',
      telefoon: '123',
      emailAdres: 'test@test.com'
    });
    
    component.onSave();
    
    expect(mockApiService.createBeheerder).toHaveBeenCalledWith({
      id: null,
      voornaam: 'John',
      achternaam: 'Doe',
      telefoon: '123',
      emailAdres: 'test@test.com'
    });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Manager created successfully', 'Close', { duration: 3000 });
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should call updateBeheerder when form is valid and id exists', () => {
    component.beheerderForm.patchValue({
      id: '123',
      voornaam: 'John',
      achternaam: 'Doe',
      telefoon: '123',
      emailAdres: 'test@test.com'
    });
    
    component.onSave();
    
    expect(mockApiService.updateBeheerder).toHaveBeenCalledWith({
      id: '123',
      voornaam: 'John',
      achternaam: 'Doe',
      telefoon: '123',
      emailAdres: 'test@test.com'
    });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Manager updated successfully', 'Close', { duration: 3000 });
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should handle save error', () => {
    component.beheerderForm.patchValue({
      id: '',
      voornaam: 'John',
      achternaam: 'Doe',
      emailAdres: 'test@test.com'
    });
    mockApiService.createBeheerder.mockReturnValue(throwError(() => new Error('Err')));
    
    component.onSave();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to create Manager', 'Close', { duration: 3000 });
    expect(component.isBusy).toBe(false);
  });

  describe('onDelete', () => {
    it('should do nothing if no id', () => {
      component.data = null;
      component.onDelete();
      expect(mockApiService.deleteBeheerder).not.toHaveBeenCalled();
    });

    it('should prompt for confirmation without warning if hasCv is false', () => {
      component.data = { id: '1', voornaam: 'John', achternaam: 'Doe', telefoon: '', emailAdres: '', hasCv: false };
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.onDelete();
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete manager John Doe?');
      expect(mockApiService.deleteBeheerder).toHaveBeenCalledWith('1');
    });

    it('should prompt for confirmation with warning if hasCv is true', () => {
      component.data = { id: '1', voornaam: 'Jane', achternaam: 'Doe', telefoon: '', emailAdres: '', hasCv: true };
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.onDelete();
      
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('WARNING: This manager is also a consultant with a coupled CV'));
      expect(mockApiService.deleteBeheerder).not.toHaveBeenCalled();
    });

    it('should handle successful delete', () => {
      component.data = { id: '1', voornaam: 'John', achternaam: 'Doe', telefoon: '', emailAdres: '', hasCv: false };
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.onDelete();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Manager deleted successfully', 'Close', { duration: 3000 });
      expect(mockDialogRef.close).toHaveBeenCalledWith('deleted');
    });

    it('should handle delete error', () => {
      component.data = { id: '1', voornaam: 'John', achternaam: 'Doe', telefoon: '', emailAdres: '', hasCv: false };
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      mockApiService.deleteBeheerder.mockReturnValue(throwError(() => new Error('Err')));
      
      component.onDelete();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete Manager', 'Close', { duration: 3000 });
      expect(component.isBusy).toBe(false);
    });
  });
});
