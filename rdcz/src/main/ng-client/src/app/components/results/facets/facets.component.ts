import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

import { FacetField } from '../../../models/facet-field';
import { Facet } from '../../../models/facet';
import { Filter } from '../../../models/filter';
import { AppState } from '../../../app.state';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-facets',
  templateUrl: './facets.component.html',
  styleUrls: ['./facets.component.scss']
})
export class FacetsComponent implements OnInit, OnChanges {
  
  @Input() facetFields: FacetField[] = [];
  @Input() page = "results";
  @Input() allClosed = true;
  @Input() allOpen = true;
  subscriptions: Subscription[] = [];
  
  constructor(public service: AppService, public state: AppState) { }

  ngOnInit() {
//    
//    this.subscriptions.push(this.state.searchSubject.subscribe(
//      (resp) => {
//        //console.log(resp);
//        if (resp['type'].indexOf('results') > -1) {
//          if (resp['state'] === 'start') {
//            this.facetFields = [];
//          } else {
//            this.fillFacets(this.state.facets);
//          }
//        }
//      }
//    ));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }
  
  public ngOnChanges(changes: SimpleChanges): void {
//    console.log(changes);
    
//    if (changes['facetFields']){
////      this.view = true;
//    }
  }
  
  add(f: Facet){
    let filter: Filter = new Filter();
    filter.field = f.field;
    filter.value = f.value;
    this.state.addFilter(filter);
    this.service.goToResults();
  }
  
  translate(ff: FacetField, f: Facet){
    if (ff.classname){
      return this.service.translateFromLists(ff.classname, f.value);
    } else {
      return f.value
    }
  }

//  facetUsed(field: string, value: string) {
//    for (let f in this.filters) {
//      let name = this.filters[f].field + '';
//      if (name === field) {
//        if (this.filters[f].isMultiple) {
//          for (let i = 0; i < this.filters[f].values.length; i++) {
//            if (value === this.filters[f].values[i].displayValue) {
//              return true;
//            }
//          }
//        } else {
//          if (value === this.filters[f].displayValue) {
//            return true;
//          }
//        }
//      }
//    }
//    return false;
//  }
   
  // state facets are visible
  isVisible(i: number, ff: FacetField) {
    if(i < 5) {
      return true;
    }
    if(ff.hasOwnProperty('expanded')) {
      return ff['expanded'];
    } 
    else { 
      return false;
    }
  }
  
  // click and show more facets
  toggleMoreFacets(ff: FacetField) {
    if(ff.hasOwnProperty('expanded')) {
      ff['expanded'] = !ff['expanded'];
    } 
    else {
      ff['expanded'] = true;
    }
  }
}
