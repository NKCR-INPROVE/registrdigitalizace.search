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

    let params: URLSearchParams = new URLSearchParams();
    if(this.state.q && this.state.q !== ''){
      params.set('q', this.state.q);
    } else {
      params.set('q', '*');
    }
    params.set('rows', '10');
    params.set('facet', 'true');
    params.set('facet.mincount', '1');
    for (let i in this.state.config['facets']){
      params.append('facet.field', this.state.config['facets'][i]['field']);
    }
    
    params.set('facet.range', 'rokvyd');
    params.set('facet.range.start',  '1');
    params.set('facet.range.end', (new Date()).getFullYear() + '');
    params.set('facet.range.gap', '10');
    
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
