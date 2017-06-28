import { Component, OnInit } from '@angular/core';

import { AppState } from '../../../app.state';

@Component({
  selector: 'app-query-as-filter',
  templateUrl: './query-as-filter.component.html',
  styleUrls: ['./query-as-filter.component.scss']
})
export class QueryAsFilterComponent implements OnInit {
  
  qcheck: boolean;


  constructor(public state: AppState) { }

  ngOnInit() {
  }
  
  change(){
    this.state.setQueryAsFilter();
  }

}
