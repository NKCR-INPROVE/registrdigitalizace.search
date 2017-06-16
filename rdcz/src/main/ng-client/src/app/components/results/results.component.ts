import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { Result } from '../../models/result';
import { AppService } from '../../app.service';
import { AppState } from '../../app.state';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

  subscriptions: Subscription[] = [];
  facets: any;
  results: Result[] = [];
  numFound: number;
  
  constructor(private service: AppService, public state: AppState) {
  }


  ngOnInit() {
    if (this.state.config) {
      this.getData();
    } else {
      this.subscriptions.push(this.service.langSubject.subscribe(
        () => {
          this.getData();
        }
      ));
    }
    
    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        if(resp['state'] === 'start'){
          this.facets = null  ;
          this.results = [];
        } else {
          this.facets = resp['res']["facet_counts"]["facet_fields"];
          this.results = resp['res']["response"]["docs"];
        }
        
      }
    ));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

  getData() {

    let params: URLSearchParams = new URLSearchParams();
    params.set('q', '*');
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
    
    this.facets = null;
    this.service.search(params);
  }

}
