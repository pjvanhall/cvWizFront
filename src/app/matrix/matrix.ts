import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { CvwizApiService } from '../cvwiz-api.service';
import { SkillMatrix, TechniekMatrixDto } from '../cvwiz.models';

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTableModule
  ],
  templateUrl: './matrix.html',
  styleUrl: './matrix.scss',
})
export class Matrix {
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;
  matrixLookupId: number | null = null;
  matrixCategory = '';
  matrixTechnique = '';
  loadedMatrix: TechniekMatrixDto | null = null;

  displayedColumns: string[] = ['category', 'techniek', 'level'];

  get flattenedMatrixData() {
    if (!this.loadedMatrix || !this.loadedMatrix.matrix) return [];
    const data: { category: string; techniek: string; level: number | string }[] = [];
    
    const categories = Object.entries(this.loadedMatrix.matrix);
    if (categories.length === 0) return data;

    for (const [name, tools] of categories) {
      const toolEntries = Object.entries(tools ?? {});
      if (toolEntries.length === 0) {
        data.push({ category: name, techniek: 'No technieken', level: '-' });
      } else {
        for (const [toolName, level] of toolEntries) {
          data.push({ category: name, techniek: toolName, level });
        }
      }
    }
    return data;
  }

  loadMatrix(): void {
    if (this.matrixLookupId === null) {
      this.showMessage('Enter a matrix id.');
      return;
    }

    this.isBusy = true;
    this.api.getTechniekMatrix(this.matrixLookupId).subscribe({
      next: (matrix) => {
        this.loadedMatrix = matrix;
        this.showMessage(`Loaded matrix ${matrix.id}.`);
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to load Matrix');
        this.isBusy = false;
      }
    });
  }

  addMatrixCategory(): void {
    this.mutateMatrix('category');
  }

  addMatrixTechnique(): void {
    this.mutateMatrix('technique');
  }

  private mutateMatrix(kind: 'category' | 'technique'): void {
    const category = this.matrixCategory.trim();
    const technique = this.matrixTechnique.trim();

    if (!category || !technique) {
      this.showMessage('Category and technique are required.');
      return;
    }

    this.isBusy = true;
    const request = kind === 'category'
      ? this.api.addCategory(category, technique)
      : this.api.addTechnique(category, technique);

    request.subscribe({
      next: (message) => {
        this.showMessage(message || 'Matrix updated.');
        if (this.matrixLookupId !== null) {
          this.loadMatrix();
        } else {
          this.isBusy = false;
        }
      },
      error: () => {
        this.showMessage('Failed to update Matrix');
        this.isBusy = false;
      }
    });
  }

  private showMessage(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
