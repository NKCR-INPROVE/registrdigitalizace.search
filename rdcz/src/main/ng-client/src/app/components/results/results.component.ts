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
  facets: any = [];
  results: Result[] = [];
  expanded: any = {};
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
        //console.log(resp);
        if (resp['type'].indexOf('results') > -1) {
          if (resp['state'] === 'start') {
            this.facets = null;
            this.results = [];
            this.expanded = {};
          } else {
            this.facets = resp['res']["facet_counts"]["facet_fields"];
            this.results = resp['res']["response"]["docs"];
            if(resp['res'].hasOwnProperty("expanded")){
              this.expanded = resp['res']["expanded"];
            }
          }

          //PEDRITO, dej pryc timeout
          setTimeout(() => {
            this.loading = false;
          }, 1000);
        }
      }
    ));


    this.subscriptions.push(this.state.searchParamsChanged.subscribe(
      (resp) => {
        if (resp['state'] === 'start') {

        } else {
          this.getData();
          //this.service.goToResults();
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

    let params: URLSearchParams = this.service.doSearchParams();

    this.facets = null;
    
    //this.service.goToResults();
    this.service.search(params);
  }

}
