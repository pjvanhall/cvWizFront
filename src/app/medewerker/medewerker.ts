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
import { MedewerkerDto, MedewerkerListDto } from '../cvwiz.models';
import { MedewerkerDetailDialogComponent } from './medewerker-detail-dialog/medewerker-detail-dialog.component';

@Component({
  selector: 'app-medewerker',
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
  templateUrl: './medewerker.html',
  styleUrl: './medewerker.scss',
})
export class Medewerker implements OnInit {
  private readonly api = inject(CvwizApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;
  consultants = new MatTableDataSource<MedewerkerListDto>([]);
  displayedColumns: string[] = ['voornaam', 'achternaam', 'emailAdres', 'telefoon', 'actions'];

  ngOnInit(): void {
    this.loadConsultants();
  }

  loadConsultants(): void {
    this.isBusy = true;
    this.api.getAllMedewerkers().subscribe({
      next: (data) => {
        console.log('Received consultants:', data);
        this.consultants.data = data;
        this.isBusy = false;
      },
      error: (err) => {
        console.error('Error fetching consultants:', err);
        this.snackBar.open('Failed to load consultants', 'Close', { duration: 3000 });
        this.isBusy = false;
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(MedewerkerDetailDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConsultants();
      }
    });
  }

  openEditDialog(consultant: MedewerkerListDto): void {
    const dialogRef = this.dialog.open(MedewerkerDetailDialogComponent, {
      width: '500px',
      data: consultant
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConsultants();
      }
    });
  }
}
