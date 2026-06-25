import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatrixDetailDialogComponent } from './matrix-detail-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TechniekMatrixDto } from '../../cvwiz.models';

describe('MatrixDetailDialogComponent', () => {
  let component: MatrixDetailDialogComponent;
  let fixture: ComponentFixture<MatrixDetailDialogComponent>;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MatrixDetailDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();
  });

  function createComponent(data: TechniekMatrixDto | null) {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(MatrixDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create with no data', () => {
    createComponent(null);
    expect(component).toBeTruthy();
    expect(component.flattenedMatrixData).toEqual([]);
  });

  it('should create with empty matrix', () => {
    createComponent({ id: 1, matrix: {} });
    expect(component.flattenedMatrixData).toEqual([]);
  });

  it('should flatten matrix data with tools', () => {
    const data: TechniekMatrixDto = {
      id: 1,
      matrix: {
        'Languages': { 'Java': 1, 'TypeScript': 2 }
      }
    };
    createComponent(data);

    expect(component.flattenedMatrixData).toEqual([
      { category: 'Languages', techniek: 'Java', level: 1 },
      { category: 'Languages', techniek: 'TypeScript', level: 2 }
    ]);
  });

  it('should handle category with no tools', () => {
    const data: TechniekMatrixDto = {
      id: 1,
      matrix: {
        'Empty Category': {}
      }
    };
    createComponent(data);

    expect(component.flattenedMatrixData).toEqual([
      { category: 'Empty Category', techniek: 'No technieken', level: '-' }
    ]);
  });

  it('should close dialog', () => {
    createComponent(null);
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
