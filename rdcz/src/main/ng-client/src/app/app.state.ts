import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

  
@Injectable()
export class AppState {

  private _stateSubject = new Subject();
  public stateChangedSubject: Observable<any> = this._stateSubject.asObservable();
  
  public _configSubject = new Subject();
  public configSubject: Observable<any> = this._configSubject.asObservable();
  
  //Holds client configuration
  config: any;
  
  //Holds start query parameter
  start: number = 0;

  //Holds number of rows per page. Default value from configuration
  rows: number = 10;

  sorts = [
    //{ "label": "Dle relevance", "field": "score desc" },
    { "label": "Dle idetifikatoru", "field": "uniqueid asc" },
    { "label": "Dle data", "field": "rok_vzniku desc" },
    { "label": "Dle autora", "field": "autor_sort asc" }
  ];
  currentSort: any = this.sorts[0];
  currentLang : string;
  
  
  //Controls full screen viewer
  public isFull: boolean = false;
  
  public breadcrumbs = [];
  
  public route: string;
  
  setConfig(cfg){
    this.config = cfg;
    this._configSubject.next(cfg);
  }
  
  //params
  stateChanged(){    
    this._stateSubject.next(this);
  }
  
  setBreadcrumbs(){
    
  }
}
