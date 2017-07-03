import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Result } from './models/result';
import { Filter } from './models/filter';
import { FacetField } from './models/facet-field';
import { Facet } from './models/facet';

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

  lists: any = {};


  //Searchresults variables
  //Observe search ocurred
  public _searchSubject = new Subject();
  public searchSubject: Observable<any> = this._searchSubject.asObservable();

  facets: any;
  results: Result[] = [];
  numFound: number;
  totalPages: number = 0;
  numPages: number = 5;

  //Search parameters state variables
  //Observe search parameters ocurred
  public _searchParamsChanged = new Subject();
  public searchParamsChanged: Observable<any> = this._searchParamsChanged.asObservable();

  //Holds start query parameter
  start: number = 0;

  //Holds number of rows per page. Default value from configuration
  rows: number = 10;
  currentSort: any = this.sorts[0];
  currentCollapse: any = this.collapses[2];
  public usedFilters: Filter[] = [];
  public q: string;
  currentOd: number = 0;
  currentDo: number = (new Date()).getFullYear();
  
  //Advanced parameters
  advParams= {
    title: null,
    autor: null,
    rokvyd: null,
    isxn: null,
    ccnb: null,
    signatura: null,
    carkod: null,
    cislordcz: null,
    pole001: null,
    cislozakazky: null,
    can: null
  };


  qcheck: boolean;

  public route: string;

  setConfig(cfg) {
    this.config = cfg;
    this.collapses = cfg['collapses'];
    this.configured = true;
    this._configSubject.next(cfg);
  }

  //params
  stateChanged() {
    this._stateSubject.next(this);
  }

  setFilters() {

  }

  clearParams() {
    this.q = '';
    this.currentOd = 0;
    this.currentDo = (new Date()).getFullYear();
    this.start = 0;
    this.usedFilters = [];
  }

  clearResults() {
    this.numFound = 0;
    this.facets = null;
    this.results = null;
    this.totalPages = 0;
      this._searchParamsChanged.next(this);
  }

  setSearchParamsFromUrl(params) {
    this.usedFilters = [];
    if (params.hasOwnProperty('q')) {
      if (params['q'] !== '*') {
        this.q = params['q'];
      }
    }
    if (params.hasOwnProperty('start')) {
      this.start = +params['start'];
    }
    if (params.hasOwnProperty('rows')) {
      this.rows = +params['rows'];
    }
    if (params.hasOwnProperty('filters')) {
      let f = params['filters'];
      if (f) {
        let j = JSON.parse(params['filters']);
        for (let i in j) {
          let c: Filter = new Filter();
          Object.assign(c, j[i]);
          this.usedFilters.push(c);
        }
      }
    }
    
    
    if (params.hasOwnProperty('adv')) {
      let f = params['adv'];
      if (f) {
        this.advParams = JSON.parse(params['adv']);
      }
    }
    
    if (params.hasOwnProperty('collapse')) {
      //console.log(params['collapse']);
      for (let i in this.collapses) {
        if (this.collapses[i].field === params['collapse']) {
          this.currentCollapse = this.collapses[i];
          break;
        }
      }
    }
    this.setRokVyd();
    if (this.configured) {
      this._searchParamsChanged.next(this);
    }
  }
  
  setRokVyd(){
    let f: Filter = this.getFilterByField('rokvyd');
    if (f === null) {
      this.currentOd = 0;
      this.currentDo = (new Date()).getFullYear();
    } else {
      let vals = JSON.parse(f.value);
      this.currentOd = vals[0];
      this.currentDo = vals[1];
    }
    
  }

  removeAllFilters() {
    this.usedFilters = [];
    this._searchParamsChanged.next(this);
  }

  removeFilter(f: Filter) {
    let idx = this.usedFilters.indexOf(f);
    if (f.field === 'rokvyd'){
      this.currentOd = 0;
      this.currentDo = (new Date()).getFullYear();
    }
    if (idx > -1) {
      this.usedFilters.splice(idx, 1);
      this._searchParamsChanged.next(this);
    }

  }

  addFilter(f: Filter) {
    this.usedFilters.push(f);
    //this._searchParamsChanged.next(this);
  }

  getFilterByField(field: string): Filter {

    for (let i in this.usedFilters) {
      if (this.usedFilters[i].field === field) {
        return this.usedFilters[i];
      }
    }
    return null;
  }

  getFilterIdxByField(field: string): number {

    for (let i=0; i<this.usedFilters.length; i++) {
      if (this.usedFilters[i].field === field) {
        return i;
      }
    }
    return -1;
  }

  addRokFilter(od, to) {
    this.currentOd = od;
    this.currentDo = to;
    let i: number = this.getFilterIdxByField('rokvyd');
    if (i > -1) {
      this.usedFilters.splice(i, 1);
    } 
    let c: Filter = new Filter();
    c.field = 'rokvyd';
    c.value = '[' + this.currentOd + ',' + this.currentDo + ']';
    this.usedFilters.push(c);
  }
  
  removeRokFilter(){
    this.currentOd = 0;
    this.currentDo = (new Date()).getFullYear();
      
    let i: number = this.getFilterIdxByField('rokvyd');
    if (i > -1) {
      this.usedFilters.splice(i, 1);
    } 
  }

  setQueryAsFilter() {
    //this.qcheck = checked;
  }

  setCollapse(col) {
    this.currentCollapse = col;
    this._searchParamsChanged.next(this);
  }


  setPage(page: number) {
    this.start = page * this.rows;
    this._searchParamsChanged.next(this);
  }

  setRows(r: number) {
    this.rows = r;
    this._searchParamsChanged.next(this);
  }

  startSearch(type: string) {
    this.facets = null;
    this.results = [];
    this._searchSubject.next({ state: 'start', type: type });
  }

  processSearch(res, type: string) {
    switch (type) {
      case 'results': {
        this.facets = res["facet_counts"]["facet_fields"];
        this.results = res["response"]["docs"];
        this.numFound = res['response']['numFound'];
        this.totalPages = Math.ceil(this.numFound / this.rows);
        break;
      }
      case 'home': {
        this.facets = res["facet_counts"]["facet_fields"];
        this.numFound = res['response']['numFound'];
        break;
      }
      case 'pie': {
        break;
      }
      default: {
        //        this.facets = res["facet_counts"]["facet_fields"];
        //        this.results = res["response"]["docs"];
        //        this.numFound = res['response']['numFound'];
      }
    }
    this._searchSubject.next({ state: 'finished', type: type, res: res });
  }


  fillFacets(fields: string[], allClosed: boolean): FacetField[] {
    

if(!this.facets){
  return [];
}
    let facetFields: FacetField[] = [];

    let configFacets = this.config['facets'];
    for (let i in configFacets) {
      let field = configFacets[i]['field'];
      if (fields.indexOf(field) > -1) {
        if (this.facets.hasOwnProperty(field) && Object.keys(this.facets[field]).length > 1) {
          var facetField = new FacetField();
          facetField.field = field + '';
          facetField.icon = configFacets[i]['icon'];
          facetField.active = !allClosed && configFacets[i]['active'];
          facetField.classname = configFacets[i]['classname'];
          facetField.isMultiple = this.config['searchParams']['multipleFacets'] && this.config['searchParams']['multipleFacets'].indexOf(field) > -1;
          if (this.config['searchParams']['json.nl'] === 'map') {
            for (let f in this.facets[field]) {
              this.pushFacetValue(facetField, field, f, this.facets[field][f]);
            }
            facetFields.push(facetField);
          } else if (this.config['searchParams']['json.nl'] === 'arrmap') {
            for (let f in this.facets[field]) {
              let value = Object.keys(this.facets[field][f])[0];
              this.pushFacetValue(facetField, field, value, this.facets[field][f][value]);
            }
            facetFields.push(facetField);
          } else { //if (this.state.config['searchParams']['json.nl'] === 'arrarr') {
            for (let f in this.facets[field]) {
              this.pushFacetValue(facetField, field, this.facets[field][f][0], this.facets[field][f][1]);
            }
            facetFields.push(facetField);
          }
        }
      }
    }
    return facetFields;
  }

  pushFacetValue(facetField: FacetField, field: string, value: string, count: number) {
    if (value.trim() !== '') {
      let facet = new Facet();
      facet.field = field;
      facet.value = value;
      facet.count = count;
      //      facet.isUsed = this.facetUsed(field, value);
      facetField.values.push(facet);
    }
  }

}
