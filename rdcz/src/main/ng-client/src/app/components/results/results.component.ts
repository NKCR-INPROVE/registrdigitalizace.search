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
export class ResultsComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];
  facets: any;
  results: Result[] = [];
  numFound: number;
  loading: boolean = true;
  
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
        setTimeout(()=>{
          this.loading = false;
        }, 1000);
        
        
      }
    ));
    
    
    this.subscriptions.push(this.state.searchParamsChanged.subscribe(
      (resp) => {
        if(resp['state'] === 'start'){
          
        } else {
          this.getData();
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
    this.loading = true;

    let params: URLSearchParams = new URLSearchParams();
    params.set('q', '*');
    params.set('start', this.state.start + '');
    params.set('rows', this.state.rows + '');
    params.set('facet', 'true');
    params.set('facet.mincount', '1');
    for (let i in this.state.config['facets']){
      params.append('facet.field', this.state.config['facets'][i]['field']);
    }
    
    params.set('facet.range', 'rokvyd');
    params.set('facet.range.start',  '0');
    params.set('facet.range.end', (new Date()).getFullYear() + '');
    params.set('facet.range.gap', '10');
    
    for(let i in this.state.usedFilters){
      let fq = this.state.usedFilters[i].field + ':"' + this.state.usedFilters[i].value + '"';
      params.append('fq', fq);
    }
    
    if (this.state.currentCollapse['field'] !== 'none'){
      params.append('fq', '{!collapse field='+this.state.currentCollapse['field']+'}');
    }
    
    this.facets = null;
    this.service.search(params);
  }

}
