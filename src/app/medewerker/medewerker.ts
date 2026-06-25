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
import { Router } from '@angular/router';

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
  private readonly router = inject(Router);

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

  editCv(consultant: MedewerkerListDto): void {
    this.isBusy = true;
    this.api.getMedewerker(consultant.id!).subscribe({
      next: (fullData) => {
        this.isBusy = false;
        const name = `${consultant.voornaam} ${consultant.achternaam}`;
        if (fullData.orgineleCv?.id) {
          this.router.navigate(['/cv'], { state: { id: fullData.orgineleCv.id, name } });
        } else {
          this.router.navigate(['/cv'], { state: { medewerkerId: fullData.id, name } });
        }
      },
      error: () => {
        this.isBusy = false;
        this.snackBar.open('Failed to fetch consultant details.', 'Close', { duration: 3000 });
      }
    });
  }

  deleteConsultant(consultant: MedewerkerListDto): void {
    const warning = consultant.hasCv 
      ? `\n\nWARNING: This consultant has a CV coupled. Deleting this consultant will also permanently delete their CV and skill matrix!`
      : '';
      
    if (confirm(`Are you sure you want to delete consultant ${consultant.voornaam} ${consultant.achternaam}?${warning}`)) {
      this.isBusy = true;
      this.api.deleteMedewerker(consultant.voornaam, consultant.achternaam).subscribe({
        next: () => {
          this.snackBar.open('Consultant deleted successfully', 'Close', { duration: 3000 });
          this.loadConsultants();
        },
        error: () => {
          this.snackBar.open('Failed to delete Consultant', 'Close', { duration: 3000 });
          this.isBusy = false;
        }
      });
    }
  }
}
