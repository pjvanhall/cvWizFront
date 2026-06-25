import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Matrix, MatrixRow } from './matrix';
import { CvwizApiService } from '../cvwiz-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Matrix Component', () => {
  let component: Matrix;
  let fixture: ComponentFixture<Matrix>;
  let mockApiService: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockApiService = {
      getTechniekMatrix: jest.fn().mockReturnValue(of({
        matrix: {
          'Languages': { 'Java': 1, 'TypeScript': 2 },
          'Databases': { 'MySQL': 1 }
        }
      })),
      addEmptyCategory: jest.fn().mockReturnValue(of('Category added')),
      editCategory: jest.fn().mockReturnValue(of('Category updated')),
      editTechnique: jest.fn().mockReturnValue(of('Technique updated')),
      deleteCategory: jest.fn().mockReturnValue(of('Category deleted')),
      deleteTechnique: jest.fn().mockReturnValue(of('Technique deleted')),
      addTechnique: jest.fn().mockReturnValue(of('Technique added'))
    };

    mockSnackBar = {
      open: jest.fn()
    };

    jest.spyOn(window, 'prompt').mockImplementation(() => '');
    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    await TestBed.configureTestingModule({
      imports: [Matrix, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .overrideComponent(Matrix, {
      remove: { imports: [] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Matrix);
    component = fixture.componentInstance;
    
    mockSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(mockSnackBar, 'open').mockImplementation();

    fixture.detectChanges();
  });

  it('should create and load matrix on init', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.getTechniekMatrix).toHaveBeenCalledWith(1);
    
    expect(component.matrixData.data.length).toBe(5); // 2 categories + 3 techniques
    expect(component.matrixData.data[0]).toEqual({ isCategory: true, category: 'Databases', technique: '' });
    expect(component.matrixData.data[1]).toEqual({ isCategory: false, category: 'Databases', technique: 'MySQL' });
  });

  it('should handle load matrix error', () => {
    mockApiService.getTechniekMatrix.mockReturnValue(throwError(() => new Error('Error')));
    component.loadBaseMatrix();

    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load base matrix', 'Close', expect.any(Object));
    expect(component.isBusy).toBe(false);
  });

  describe('addNewCategory', () => {
    it('should prompt and add category', () => {
      jest.spyOn(window, 'prompt').mockReturnValue('New Cat');
      component.addNewCategory();

      expect(window.prompt).toHaveBeenCalled();
      expect(mockApiService.addEmptyCategory).toHaveBeenCalledWith('New Cat');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Category added', 'Close', expect.any(Object));
      expect(mockApiService.getTechniekMatrix).toHaveBeenCalledTimes(2);
    });

    it('should do nothing if prompt is empty', () => {
      jest.spyOn(window, 'prompt').mockReturnValue('');
      component.addNewCategory();

      expect(mockApiService.addEmptyCategory).not.toHaveBeenCalled();
    });

    it('should handle add empty category error', () => {
      jest.spyOn(window, 'prompt').mockReturnValue('New Cat');
      mockApiService.addEmptyCategory.mockReturnValue(throwError(() => new Error('Error')));
      component.addNewCategory();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to add category', 'Close', expect.any(Object));
    });
  });

  describe('editRow', () => {
    it('should edit category', () => {
      const row: MatrixRow = { isCategory: true, category: 'Databases', technique: '' };
      jest.spyOn(window, 'prompt').mockReturnValue('New DBs');
      component.editRow(row);

      expect(window.prompt).toHaveBeenCalledWith(expect.stringContaining("Enter new name for category 'Databases'"), 'Databases');
      expect(mockApiService.editCategory).toHaveBeenCalledWith('Databases', 'New DBs');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Category updated', 'Close', expect.any(Object));
      expect(mockApiService.getTechniekMatrix).toHaveBeenCalledTimes(2);
    });

    it('should handle edit category error', () => {
      const row: MatrixRow = { isCategory: true, category: 'Databases', technique: '' };
      jest.spyOn(window, 'prompt').mockReturnValue('New DBs');
      mockApiService.editCategory.mockReturnValue(throwError(() => new Error('Err')));
      
      component.editRow(row);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update category', 'Close', expect.any(Object));
    });

    it('should edit technique', () => {
      const row: MatrixRow = { isCategory: false, category: 'Databases', technique: 'MySQL' };
      jest.spyOn(window, 'prompt').mockReturnValue('PostgreSQL');
      component.editRow(row);

      expect(window.prompt).toHaveBeenCalledWith(expect.stringContaining("Enter new name for technique 'MySQL'"), 'MySQL');
      expect(mockApiService.editTechnique).toHaveBeenCalledWith('Databases', 'MySQL', 'PostgreSQL');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Technique updated', 'Close', expect.any(Object));
    });

    it('should do nothing if prompt is cancelled for technique', () => {
      const row: MatrixRow = { isCategory: false, category: 'Databases', technique: 'MySQL' };
      jest.spyOn(window, 'prompt').mockReturnValue(null);
      component.editRow(row);

      expect(mockApiService.editTechnique).not.toHaveBeenCalled();
    });

    it('should handle edit technique error', () => {
      const row: MatrixRow = { isCategory: false, category: 'Databases', technique: 'MySQL' };
      jest.spyOn(window, 'prompt').mockReturnValue('PostgreSQL');
      mockApiService.editTechnique.mockReturnValue(throwError(() => new Error('Err')));
      
      component.editRow(row);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update technique', 'Close', expect.any(Object));
    });
  });

  describe('deleteRow', () => {
    it('should delete category', () => {
      const row: MatrixRow = { isCategory: true, category: 'Databases', technique: '' };
      component.deleteRow(row);

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("permanently delete the entire category 'Databases'"));
      expect(mockApiService.deleteCategory).toHaveBeenCalledWith('Databases');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Category deleted', 'Close', expect.any(Object));
    });

    it('should handle delete category error', () => {
      const row: MatrixRow = { isCategory: true, category: 'Databases', technique: '' };
      mockApiService.deleteCategory.mockReturnValue(throwError(() => new Error('Err')));
      component.deleteRow(row);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete category', 'Close', expect.any(Object));
    });

    it('should delete technique', () => {
      const row: MatrixRow = { isCategory: false, category: 'Databases', technique: 'MySQL' };
      component.deleteRow(row);

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("permanently delete the technique 'MySQL'"));
      expect(mockApiService.deleteTechnique).toHaveBeenCalledWith('Databases', 'MySQL');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Technique deleted', 'Close', expect.any(Object));
    });

    it('should do nothing if confirm is false', () => {
      const row: MatrixRow = { isCategory: false, category: 'Databases', technique: 'MySQL' };
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteRow(row);

      expect(mockApiService.deleteTechnique).not.toHaveBeenCalled();
    });

    it('should handle delete technique error', () => {
      const row: MatrixRow = { isCategory: false, category: 'Databases', technique: 'MySQL' };
      mockApiService.deleteTechnique.mockReturnValue(throwError(() => new Error('Err')));
      component.deleteRow(row);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete technique', 'Close', expect.any(Object));
    });
  });

  describe('addTechniqueToCategory', () => {
    it('should add technique', () => {
      const row: MatrixRow = { isCategory: true, category: 'Databases', technique: '' };
      jest.spyOn(window, 'prompt').mockReturnValue('Oracle');
      component.addTechniqueToCategory(row);

      expect(window.prompt).toHaveBeenCalledWith(expect.stringContaining("Enter new technique name for category 'Databases'"));
      expect(mockApiService.addTechnique).toHaveBeenCalledWith('Databases', 'Oracle');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Technique added', 'Close', expect.any(Object));
    });

    it('should handle add technique error', () => {
      const row: MatrixRow = { isCategory: true, category: 'Databases', technique: '' };
      jest.spyOn(window, 'prompt').mockReturnValue('Oracle');
      mockApiService.addTechnique.mockReturnValue(throwError(() => new Error('Err')));
      component.addTechniqueToCategory(row);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to add technique', 'Close', expect.any(Object));
    });
  });
});
