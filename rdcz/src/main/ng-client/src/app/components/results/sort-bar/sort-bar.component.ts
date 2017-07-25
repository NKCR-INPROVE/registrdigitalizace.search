import { Component, OnInit } from '@angular/core';

import { AppState } from '../../../app.state';

@Component({
  selector: 'app-sort-bar',
  templateUrl: './sort-bar.component.html',
  styleUrls: ['./sort-bar.component.scss']
})
export class SortBarComponent implements OnInit {
  
  showingChartBar: boolean = false;

  constructor(public state: AppState) { }

  ngOnInit() {
  }
  
  setCollapse(col){
    this.state.setCollapse(col);
  }
  
  // toggle element
  toggleElement(id){
    this.showingChartBar = !this.showingChartBar;
    $('#'+id).toggleClass('active');
    $('#'+id).slideToggle( "fast" );
  }
}
