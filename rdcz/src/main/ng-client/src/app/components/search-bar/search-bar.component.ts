import { Component, OnInit } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { AppService } from '../../app.service';
import { AppState } from '../../app.state';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  //public q: string;
  
  isAdvancedCollapsed: boolean = true; // pedro
  
  constructor(private service: AppService, public state: AppState) {
  }

  ngOnInit() {
  }
  
  search() {

    let params: URLSearchParams = this.service.doSearchParams();
    
//    this.facets = null;
    this.service.search(params);
    
  }
  
  // pedro
  openAdvanced() {
    setTimeout(() => {
      this.isAdvancedCollapsed = !this.isAdvancedCollapsed;
    }, 100);
  }

}
