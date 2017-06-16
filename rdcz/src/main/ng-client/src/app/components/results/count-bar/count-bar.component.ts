import { Component, OnInit } from '@angular/core';

import { AppState } from '../../../app.state';

@Component({
  selector: 'app-count-bar',
  templateUrl: './count-bar.component.html',
  styleUrls: ['./count-bar.component.scss']
})
export class CountBarComponent implements OnInit {

  constructor(public state: AppState) { }

  ngOnInit() {
  }

}
