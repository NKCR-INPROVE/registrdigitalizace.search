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
  filters: Filter[] = [];
  //filtersGroup = [];

  constructor(public state: AppState, public service: AppService) { }

  ngOnInit() {
    this.subscriptions.push(this.state.searchParamsChanged.subscribe(
      (resp) => {
        if(resp['state'] === 'start'){
//          this.filtersGroup = [];
        } else {
////          //Object.assign(this.filters, this.state.usedFilters);
//          let filters = new Array<Filter>();
//          for(let i in this.state.usedFilters){
//            filters.push(this.state.usedFilters[i]);
//          }
//          
//          this.filtersGroup.push(filters);
          this.filters = this.state.usedFilters;
        }
//        this.filters = state.usedFilters
      }
    ));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }
  
  remove(f: Filter){
    this.state.removeFilter(f);
  }

}
