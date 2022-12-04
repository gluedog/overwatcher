import { FormControl } from '@angular/forms';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'ovw-rules-modal',
  templateUrl: './rules-modal.component.html',
  styleUrls: ['./rules-modal.component.scss']
})
export class RulesModalComponent {

  public annoyingModalControl: FormControl = new FormControl(false);

  constructor(
    public dialogRef: MatDialogRef<RulesModalComponent>,
  ) {
  }



  public close(): void {
    if (this.annoyingModalControl.value) {
      localStorage.setItem('new-season-modal', (+new Date() + 10 * 24 * 60 * 60 * 1000).toString())
    }
    this.dialogRef.close();
  }

}
