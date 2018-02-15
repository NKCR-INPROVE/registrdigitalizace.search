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
//    this.page = this.route.snapshot.paramMap.get('page');
  }

  select(f: string) {
    this.selected.emit(this.dir['name'] + '/' + f);
  }
  propagate(f: string) {
    this.selected.emit(this.dir['name'] + '/' + f);
  }

  isActive(f: string) {
    let param = '/' + this.route.snapshot.url.join("/");
    if (this.route.snapshot.children.length > 0){
      param += '/' + this.route.snapshot.children[0].url.join("/");
    }
    return param.endsWith(this.dir['name'] + '/' + f);
    //console.log(this.page, this.dir['name'], f);
    //return this.route.snapshot.paramMap.get('page') === f;
  }



}
