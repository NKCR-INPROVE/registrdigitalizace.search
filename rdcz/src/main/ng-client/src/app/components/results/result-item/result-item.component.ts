import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { AppService } from '../../../app.service';
import { AppState } from '../../../app.state';
import { Result } from '../../../models/result';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent implements OnInit, OnDestroy {

  @Input() result: Result;
  @Input() expanded: Result;
  subscriptions: Subscription[] = [];

  showingDetail: boolean = false;
  predlohy: Result[] = [];
  predlohyLoaded: boolean = false;
  
  stavy = [];

  constructor(private service: AppService, public state: AppState) { }

  ngOnInit() {
    if (this.result) {
      this.getPredlohy();
    }
    
    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        if (resp['type'].indexOf(this.result[this.state.currentCollapse.field]) > -1) {
          if (resp['state'] === 'start') {
//            this.facets = null;
//            this.results = [];
//            this.expanded = {};
          } else {
            resp['res']["facet_counts"]["facet_fields"]['stav'].forEach((a)=>{
              this.stavy.push(a[0]);
            });
            
            this.predlohy = resp['res']["response"]["docs"];
          }
          
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
  
  translate(classname, value){
    return this.service.translateFromLists(classname, value);
  }

  getPredlohy() {
    if (this.result) {
      if (this.expanded) {
        let params: URLSearchParams = new URLSearchParams();
        params.set('q', this.state.currentCollapse.field + ':"' + this.result[this.state.currentCollapse.field] + '"');
        params.set('rows', (this.expanded['numFound'] + 1) + '');
        params.set('facet', 'true');
        params.set('facet.mincount', '1');
        params.append('facet.field', 'stav');
        
        this.service.search(params, this.result[this.state.currentCollapse.field]);
      } else {
        this.predlohy.push(this.result);
        this.stavy.push(this.result['stav']);
      }
      this.predlohyLoaded = true;
    } 
  }


  // toggle content function by id
  toggleDetail(id) {
    if (!this.predlohyLoaded) {
      this.getPredlohy();
    }
    this.showingDetail = !this.showingDetail;
    $('#' + id + '-btn').toggleClass('active');
    $('#' + id).slideToggle("fast");
  }
}
