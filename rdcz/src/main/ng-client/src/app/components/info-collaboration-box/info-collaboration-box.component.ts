import { Component, OnInit } from '@angular/core';
import {AppState} from 'app/app.state';

@Component({
  selector: 'app-info-collaboration-box',
  templateUrl: './info-collaboration-box.component.html',
  styleUrls: ['./info-collaboration-box.component.scss']
})
export class InfoCollaborationBoxComponent implements OnInit {

  constructor(public state: AppState) { }

  ngOnInit() {
  }

}
