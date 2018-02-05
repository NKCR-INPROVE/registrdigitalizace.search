import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {AppState} from '../../../app.state';

@Component({
  selector: 'app-info-menu',
  templateUrl: './info-menu.component.html',
  styleUrls: ['./info-menu.component.scss']
})
export class InfoMenuComponent implements OnInit {

  @Input('dir') dir: any;
  @Input('path') path: string;
  
  page: string;
  
  @Output() selected = new EventEmitter<string>();

  constructor(
    private route: ActivatedRoute,
    public state: AppState) {}

  ngOnInit() {
    this.page = this.route.snapshot.paramMap.get('page');
  }

  select(f: string) {
    this.selected.emit(this.path + '/' + this.dir['name'] + '/' + f);
  }

  isActive(f: string) {
//    let s = this.path + '/' + this.dir['name'] + '/' + f;
    return this.route.snapshot.paramMap.get('page') === f;
  }



}
