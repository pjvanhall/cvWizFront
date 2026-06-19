import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { CvwizApiService } from '../cvwiz-api.service';

export interface MatrixRow {
  isCategory: boolean;
  category: string;
  technique: string;
}

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
export class Matrix implements OnInit {
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;

  matrixData = new MatTableDataSource<MatrixRow>([]);
  displayedColumns: string[] = ['category', 'technique', 'actions'];

  ngOnInit(): void {
    this.loadBaseMatrix();
  }

  loadBaseMatrix(): void {
    this.isBusy = true;
    this.api.getTechniekMatrix(1).subscribe({
      next: (data) => {
        const rows: MatrixRow[] = [];
        if (data.matrix) {
          for (const category of Object.keys(data.matrix).sort()) {
            rows.push({ isCategory: true, category, technique: '' });
            const tools = data.matrix[category];
            if (tools) {
              for (const technique of Object.keys(tools).sort()) {
                rows.push({ isCategory: false, category, technique });
              }
            }
          }
        }
        this.matrixData.data = rows;
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to load base matrix');
        this.isBusy = false;
      }
    });
  }

  addNewCategory(): void {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && newCategory.trim()) {
      this.isBusy = true;
      this.api.addEmptyCategory(newCategory.trim()).subscribe({
        next: (msg) => {
          this.showMessage(msg || 'Category added');
          this.loadBaseMatrix();
        },
        error: () => {
          this.showMessage('Failed to add category');
          this.isBusy = false;
        }
      });
    }
  }

  editRow(row: MatrixRow): void {
    if (row.isCategory) {
      const newName = prompt(`Enter new name for category '${row.category}':`, row.category);
      if (newName && newName.trim() && newName.trim() !== row.category) {
        this.isBusy = true;
        this.api.editCategory(row.category, newName.trim()).subscribe({
          next: (msg) => {
            this.showMessage(msg || 'Category updated');
            this.loadBaseMatrix();
          },
          error: () => {
            this.showMessage('Failed to update category');
            this.isBusy = false;
          }
        });
      }
    } else {
      const newName = prompt(`Enter new name for technique '${row.technique}':`, row.technique);
      if (newName && newName.trim() && newName.trim() !== row.technique) {
        this.isBusy = true;
        this.api.editTechnique(row.category, row.technique, newName.trim()).subscribe({
          next: (msg) => {
            this.showMessage(msg || 'Technique updated');
            this.loadBaseMatrix();
          },
          error: () => {
            this.showMessage('Failed to update technique');
            this.isBusy = false;
          }
        });
      }
    }
  }

  deleteRow(row: MatrixRow): void {
    if (row.isCategory) {
      if (confirm(`Are you sure you want to permanently delete the entire category '${row.category}' and all its techniques from ALL consultants?`)) {
        this.isBusy = true;
        this.api.deleteCategory(row.category).subscribe({
          next: (msg) => {
            this.showMessage(msg || 'Category deleted');
            this.loadBaseMatrix();
          },
          error: () => {
            this.showMessage('Failed to delete category');
            this.isBusy = false;
          }
        });
      }
    } else {
      if (confirm(`Are you sure you want to permanently delete the technique '${row.technique}' from ALL consultants?`)) {
        this.isBusy = true;
        this.api.deleteTechnique(row.category, row.technique).subscribe({
          next: (msg) => {
            this.showMessage(msg || 'Technique deleted');
            this.loadBaseMatrix();
          },
          error: () => {
            this.showMessage('Failed to delete technique');
            this.isBusy = false;
          }
        });
      }
    }
  }

  addTechniqueToCategory(row: MatrixRow): void {
    const newTechnique = prompt(`Enter new technique name for category '${row.category}':`);
    if (newTechnique && newTechnique.trim()) {
      this.isBusy = true;
      this.api.addTechnique(row.category, newTechnique.trim()).subscribe({
        next: (msg) => {
          this.showMessage(msg || 'Technique added');
          this.loadBaseMatrix();
        },
        error: () => {
          this.showMessage('Failed to add technique');
          this.isBusy = false;
        }
      });
    }
  }

  private showMessage(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
