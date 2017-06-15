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
  public q: string;
  
  constructor(private service: AppService, public state: AppState) {
  }

  ngOnInit() {
  }
  
  search() {

    let params: URLSearchParams = new URLSearchParams();
    params.set('q', this.q);
    params.set('facet', 'true');
    for (let i in this.state.config['facets']){
      params.append('facet.field', this.state.config['facets'][i]['field']);
    }
    
    params.set('facet.mincount', '1');
    params.set('rows', '10');
//    this.facets = null;
    this.service.search(params, true).subscribe(res => {
//      this.facets = res["facet_counts"]["facet_fields"];
//      this.results = res["response"]["docs"];
    });
    
  }

}
