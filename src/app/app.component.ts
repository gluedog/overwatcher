import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'overwatcher';

  public loading = true;
  constructor() {

  }

  ngOnInit(): void {
      setTimeout(() => {
        this.loading = false;
      }, 400)
  }

}
