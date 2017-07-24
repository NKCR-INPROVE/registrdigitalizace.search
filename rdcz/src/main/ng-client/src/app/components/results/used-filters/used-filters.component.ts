import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { AppState } from '../../../app.state';
import { AppService } from '../../../app.service';
import { Filter } from '../../../models/filter';

import { MzCollapsibleComponent } from 'ng2-materialize'; // _app

@Component({
  selector: 'app-used-filters',
  templateUrl: './used-filters.component.html',
  styleUrls: ['./used-filters.component.scss']
})
export class UsedFiltersComponent implements OnInit, OnDestroy {
  
  subscriptions: Subscription[] = [];

  constructor(public state: AppState, public service: AppService) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }
  
  remove(f: Filter){
    this.state.removeFilter(f);
    this.service.goToResults();
  }
  
  removeAdv(a: string){
    this.state.advParams[a] = '';
    
    this.service.goToResults();
  }
  
  removeAll(){
    this.state.removeAllFilters();
    
//    this.service.goToResults();
  }
  
  cleanQ() {
    this.state.q = '';
    this.service.goToResults();
  }
  
  translate(field: string, value: string){
    let facet = this.state.getFacetByField(field);
    if (facet && facet.hasOwnProperty('classname')){
      return this.service.translateFromLists(facet['classname'], value);
    } else {
      return value
    }
  }

}
