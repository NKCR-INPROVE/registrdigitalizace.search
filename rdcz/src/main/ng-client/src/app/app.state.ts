import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Result } from './models/result';
import { Filter } from './models/filter';

@Injectable()
export class AppState {

  private _stateSubject = new Subject();
  public stateChangedSubject: Observable<any> = this._stateSubject.asObservable();

  public _configSubject = new Subject();
  public configSubject: Observable<any> = this._configSubject.asObservable();

  //Holds client configuration
  config: any;
  configured: boolean = false;

  sorts = [
    { "label": "Dle relevance", "field": "score desc" },
    { "label": "Dle abecedy", "field": "uniqueid asc" }
  ];

  collapses = [
    { "label": "Bez sloučení", "field": "none" },
    { "label": "ISSN/ISBN", "field": "isxn_collaps" },
    { "label": "ČNB", "field": "cnb_collaps" },
    { "label": "SIGLA+ID", "field": "aba_collaps" }
  ];

  currentLang: string;


  //Searchresults variables
  //Observe search ocurred
  public _searchSubject = new Subject();
  public searchSubject: Observable<any> = this._searchSubject.asObservable();

  facets: any;
  results: Result[] = [];
  numFound: number;

  //Search parameters state variables
  //Observe search parameters ocurred
  public _searchParamsChanged = new Subject();
  public searchParamsChanged: Observable<any> = this._searchParamsChanged.asObservable();

  //Holds start query parameter
  start: number = 0;

  //Holds number of rows per page. Default value from configuration
  rows: number = 10;
  currentSort: any = this.sorts[0];
  currentCollapse: any = this.sorts[0];
  public usedFilters: Filter[] = [];

  public route: string;

  setConfig(cfg) {
    this.config = cfg;
    this.configured = true;
    this._configSubject.next(cfg);
  }

  //params
  stateChanged() {
    this._stateSubject.next(this);
  }

  setFilters() {

  }
  
  removeFilter(f: Filter){
    let idx = this.usedFilters.indexOf(f);
    if(idx > -1){
      this.usedFilters.splice(idx);
      this._searchParamsChanged.next();
    }
  }
  
  addFilter(f: Filter){
      this.usedFilters.push(f);
      this._searchParamsChanged.next();
  }

  startSearch(type: string) {
    this.facets = null;
    this.results = [];
    this._searchSubject.next({ state: 'start', type: type });
  }

  processSearch(res, type: string) {
    switch(type){
      case 'results':{
        this.facets = res["facet_counts"]["facet_fields"];
        this.results = res["response"]["docs"];
        this.numFound = res['response']['numFound'];
        break;
      }
      case 'home':{
        break;
      }
      case 'pie':{
        break;
      }
      default:{
        this.facets = res["facet_counts"]["facet_fields"];
        this.results = res["response"]["docs"];
        this.numFound = res['response']['numFound'];
      }
    }
    this._searchSubject.next({ state: 'finished', type: type, res: res });
  }
}
