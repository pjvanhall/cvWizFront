import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

import { TechniekMatrixDto } from '../../cvwiz.models';

@Component({
  selector: 'app-matrix-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule
  ],
  templateUrl: './matrix-detail-dialog.component.html',
  styleUrl: './matrix-detail-dialog.component.scss'
})
export class MatrixDetailDialogComponent {
  displayedColumns: string[] = ['category', 'techniek', 'level'];

  constructor(
    public dialogRef: MatDialogRef<MatrixDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TechniekMatrixDto | null
  ) {}

  get flattenedMatrixData() {
    if (!this.data || !this.data.matrix) return [];
    const flattened: { category: string; techniek: string; level: number | string }[] = [];
    
    const categories = Object.entries(this.data.matrix);
    if (categories.length === 0) return flattened;

    for (const [name, tools] of categories) {
      const toolEntries = Object.entries(tools ?? {});
      if (toolEntries.length === 0) {
        flattened.push({ category: name, techniek: 'No technieken', level: '-' });
      } else {
        for (const [toolName, level] of toolEntries) {
          flattened.push({ category: name, techniek: toolName, level });
        }
      }
    }
    return flattened;
  }

  close(): void {
    this.dialogRef.close();
  }
}
