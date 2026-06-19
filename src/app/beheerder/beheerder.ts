import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CvwizApiService } from '../cvwiz-api.service';
import { BeheerderDto } from '../cvwiz.models';
import { BeheerderDetailDialogComponent } from './beheerder-detail-dialog/beheerder-detail-dialog';

@Component({
  selector: 'app-beheerder',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  templateUrl: './beheerder.html',
  styleUrl: './beheerder.scss',
})
export class Beheerder implements OnInit {
  private readonly api = inject(CvwizApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;
  beheerders = new MatTableDataSource<BeheerderDto>([]);
  displayedColumns: string[] = ['voornaam', 'achternaam', 'emailAdres', 'telefoon', 'actions'];

  ngOnInit(): void {
    this.loadBeheerders();
  }

  loadBeheerders(): void {
    this.isBusy = true;
    this.api.getAllBeheerders().subscribe({
      next: (data) => {
        this.beheerders.data = data;
        this.isBusy = false;
      },
      error: () => {
        this.snackBar.open('Failed to load managers', 'Close', { duration: 3000 });
        this.isBusy = false;
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(BeheerderDetailDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBeheerders();
      }
    });
  }

  openEditDialog(beheerder: BeheerderDto): void {
    const dialogRef = this.dialog.open(BeheerderDetailDialogComponent, {
      width: '500px',
      data: beheerder
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBeheerders();
      }
    });
  }

  deleteBeheerder(beheerder: BeheerderDto): void {
    const warning = beheerder.hasCv 
      ? `\n\nWARNING: This manager is also a consultant with a coupled CV. Deleting this manager may affect their associated consultant login.`
      : '';
      
    if (confirm(`Are you sure you want to delete manager ${beheerder.voornaam} ${beheerder.achternaam}?${warning}`)) {
      this.isBusy = true;
      if (beheerder.id) {
        this.api.deleteBeheerder(beheerder.id).subscribe({
          next: () => {
            this.snackBar.open('Manager deleted successfully', 'Close', { duration: 3000 });
            this.loadBeheerders();
          },
          error: () => {
            this.snackBar.open('Failed to delete Manager', 'Close', { duration: 3000 });
            this.isBusy = false;
          }
        });
      }
    }
  }
}
