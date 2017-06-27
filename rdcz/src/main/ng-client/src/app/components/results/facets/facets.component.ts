import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Rx';

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
  
  @Input() facets;
  @Input() page = "results";
  @Input() allClosed = true;
  isMoreFacetsCollapsed: boolean = true; // pedro
  //facetId: string; // pedro
  
  facetFields: FacetField[] = [];
  
  constructor(public service: AppService, public state: AppState) { }

  ngOnInit() {
    //this.fillFacets(this.facets);
  }
  
  public ngOnChanges(changes: SimpleChanges): void {
    //console.log(changes);
    if(changes['facets']){
      if (this.state.config){
        this.fillFacets(this.facets);
      }
    }
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
//    if (ff.classname){
//      return this.service.doGetFromLists(ff.classname, f.value).subscribe(res => {return res;});
//    } else {
//      return Observable.of(f.value);
//      //return this.service.translateKey(f.value);
//    }
  }

  fillFacets(facet_fields: any) {
    this.facetFields = [];
//    console.log(facet_fields);
    if(!facet_fields){return;}
    let configFacets = this.state.config['facets'];
    for (let i in configFacets) {
      let field = configFacets[i]['field'];
    //for (let field in facet_fields) {
      if (facet_fields.hasOwnProperty(field) && Object.keys(facet_fields[field]).length > 1) {
        var facetField = new FacetField();
        facetField.field = field + '';
        facetField.icon = configFacets[i]['icon'];
        facetField.active = !this.allClosed && configFacets[i]['active'];
        facetField.classname = configFacets[i]['classname'];
        facetField.isMultiple = this.state.config['searchParams']['multipleFacets'] && this.state.config['searchParams']['multipleFacets'].indexOf(field) > -1;
        if (this.state.config['searchParams']['json.nl'] === 'map') {
          for (let f in facet_fields[field]) {
            this.pushFacetValue(facetField, field, f, facet_fields[field][f]);
          }
          this.facetFields.push(facetField);
        } else if (this.state.config['searchParams']['json.nl'] === 'arrmap') {
          for (let f in facet_fields[field]) {
            let value = Object.keys(facet_fields[field][f])[0];
            this.pushFacetValue(facetField, field, value, facet_fields[field][f][value]);
          }
          this.facetFields.push(facetField);
        }else { //if (this.state.config['searchParams']['json.nl'] === 'arrarr') {
          for (let f in facet_fields[field]) {
            this.pushFacetValue(facetField, field, facet_fields[field][f][0], facet_fields[field][f][1]);
          }
          this.facetFields.push(facetField);
        } 
      }
    }
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
  
  // pedro
  openMoreFacets(facetId: string) {
    setTimeout(() => {
      this.isMoreFacetsCollapsed = !this.isMoreFacetsCollapsed;
    }, 100);
  }
}
