import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {HttpParams} from '@angular/common/http';

import {AppService} from '../../app.service';
import {AppState} from '../../app.state';
import {FacetField} from '../../models/facet-field';
import {Result} from '../../models/result';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];
  //facets: any = [];
  facetFields: FacetField[] = [];

  results: Result[] = [];
  expanded: any = {};
  numFound: number;
  loading: boolean = true;
  secondRound: boolean = false;

  constructor(private service: AppService, public state: AppState,
    private router: Router) {
  }


  ngOnInit() {
    //    if (this.state.config) {
    //      this.getData();
    //    } else {
    //      this.subscriptions.push(this.service.langSubject.subscribe(
    //        () => {
    //          this.getData();
    //        }
    //      ));
    //    }

    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        //console.log(resp);
        if (resp['type'].indexOf('results') > -1) {
          if (resp['state'] === 'start') {
            this.expanded = {};
            this.loading = true;
          } else {

            if (this.state.numFound === 0 && !this.secondRound) {
              this.secondRound = true;
              let sparams: HttpParams = this.service.doSearchParams('results', true, true, '10%');
              this.service.search(sparams, 'results').subscribe(res => {
                this.state.processSearch(res, 'results');
                let fparams: HttpParams = this.service.doSearchParams('results', false, false, '10%')
                  .set("rows", "0");
                this.service.search(fparams, 'facets').subscribe(res => {
                  this.state.processSearch(res, 'facets');
                });
              });
              return;
            }

            //            this.facetFields = this.state.fillFacets(this.state.config['results_facets'], false);
            this.results = resp['res']["response"]["docs"];
            if (resp['res'].hasOwnProperty("expanded")) {
              this.expanded = resp['res']["expanded"];
            }
          }

          setTimeout(() => {
            this.loading = false;
          }, 1000);
        } else if (resp['type'].indexOf('facets') > -1) {
          if (resp['state'] === 'start') {
            this.facetFields = [];
            //this.loading = true;
          } else {
            let ff = this.state.fillFacets(this.state.config['results_facets'], false);
            for (let i in ff) {
              this.facetFields.push(ff[i]);
            }
          }
        }
      }
    ));


    this.subscriptions.push(this.state.searchParamsChanged.subscribe(
      (resp) => {
        this.secondRound = false;
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
    //    let params: URLSearchParams = this.service.doSearchParams();
    //    this.service.search(params, 'results2');
  }

  rokChanged(e) {
    this.state.addRokFilter(e['from'], e['to']);
    this.service.goToResults();
  }

  cleanAll() {
    this.state.clearParams();
    this.router.navigate(['/results', {}]);
  }

}
