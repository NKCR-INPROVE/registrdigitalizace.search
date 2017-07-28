import { Component, OnInit } from '@angular/core';

import { AppState } from '../../../app.state';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-sort-bar',
  templateUrl: './sort-bar.component.html',
  styleUrls: ['./sort-bar.component.scss']
})
export class SortBarComponent implements OnInit {
  
  showingChartBar: boolean = false;

  constructor(public state: AppState, public service: AppService) { }

  ngOnInit() {
  }
  
  setCollapse(col){
    this.state.setCollapse(col);
    this.service.goToResults();
  }
  
  setSort(s){
    this.state.setSort(s);
    this.service.goToResults();
  }
  
  // toggle element
  toggleElement(id){
    this.showingChartBar = !this.showingChartBar;
    $('#'+id).toggleClass('active');
    $('#'+id).slideToggle( "fast" );
  }
}
